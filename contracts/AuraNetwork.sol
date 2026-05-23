// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuraNetwork
 * @notice SocialFi card trading platform on Monad
 * @dev Security hardened:
 *   - ReentrancyGuard pattern applied to all ETH-transferring functions
 *   - Checks-Effects-Interactions (CEI) pattern enforced
 *   - Input length validation on all string parameters
 *   - Overflow protection via Solidity 0.8.x built-in checks
 */
contract AuraNetwork {

    // =========================================================
    // REENTRANCY GUARD (OpenZeppelin-equivalent, no dependency)
    // =========================================================
    uint256 private _status;
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    // =========================================================
    // INPUT VALIDATION CONSTANTS
    // =========================================================
    uint256 private constant MAX_USERNAME_LENGTH  = 50;
    uint256 private constant MAX_TIER_NAME_LENGTH = 30;
    uint256 private constant MAX_TIER_COLOR_LENGTH = 20;
    uint256 private constant MAX_POST_LENGTH      = 1000;

    // =========================================================
    // DATA STRUCTURES
    // =========================================================
    struct Profile {
        string username;
        string tierName;
        string tierColor;
        uint256 auraScore;
        bool exists;
    }

    struct Post {
        uint256 id;
        address author;
        string content;
        uint256 timestamp;
        uint256 likes;
    }

    mapping(address => Profile) public profiles;
    address[] public registeredAddresses;

    Post[] public posts;
    mapping(uint256 => mapping(address => bool)) public postLikes;

    // Cards / Shares System
    mapping(address => mapping(address => uint256)) public keysBalance; // subject => (holder => balance)
    mapping(address => uint256) public keysSupply; // subject => supply

    // =========================================================
    // EVENTS
    // =========================================================
    event ProfileRegistered(address indexed user, string username, uint256 score);
    event PostCreated(uint256 indexed id, address indexed author, string content);
    event PostLiked(uint256 indexed id, address indexed user);
    event Trade(address indexed trader, address indexed subject, bool isBuy, uint256 shareAmount, uint256 ethAmount, uint256 supply);
    event RoomMessage(address indexed room, address indexed sender, string message, uint256 timestamp);

    // =========================================================
    // PROFILE
    // =========================================================

    /**
     * @notice Register or update a profile.
     * @dev Input lengths are validated to prevent storage bloat attacks.
     */
    function registerProfile(
        string memory _username,
        string memory _tierName,
        string memory _tierColor,
        uint256 _auraScore
    ) public {
        // --- Input Validation ---
        require(bytes(_username).length > 0,                              "Username cannot be empty");
        require(bytes(_username).length <= MAX_USERNAME_LENGTH,           "Username too long (max 50 chars)");
        require(bytes(_tierName).length <= MAX_TIER_NAME_LENGTH,          "Tier name too long (max 30 chars)");
        require(bytes(_tierColor).length <= MAX_TIER_COLOR_LENGTH,        "Tier color too long (max 20 chars)");
        require(_auraScore <= 1_000_000,                                  "Aura score out of range");

        if (!profiles[msg.sender].exists) {
            registeredAddresses.push(msg.sender);

            // Auto-mint the first card for the creator (Free)
            keysBalance[msg.sender][msg.sender] = 1;
            keysSupply[msg.sender] = 1;
            emit Trade(msg.sender, msg.sender, true, 1, 0, 1);
        }

        profiles[msg.sender] = Profile(_username, _tierName, _tierColor, _auraScore, true);
        emit ProfileRegistered(msg.sender, _username, _auraScore);
    }

    // =========================================================
    // SOCIAL ACTIONS
    // =========================================================

    function executePost(string memory _content) public {
        require(profiles[msg.sender].exists,                     "Identity not registered on the grid");
        require(bytes(_content).length > 0,                      "Sequence cannot be empty");
        require(bytes(_content).length <= MAX_POST_LENGTH,        "Post too long (max 1000 chars)");

        uint256 postId = posts.length;
        posts.push(Post(postId, msg.sender, _content, block.timestamp, 0));

        emit PostCreated(postId, msg.sender, _content);
    }

    function likePost(uint256 _postId) public {
        require(profiles[msg.sender].exists,          "Identity not registered on the grid");
        require(_postId < posts.length,               "Post does not exist");
        require(!postLikes[_postId][msg.sender],      "Already liked this post");

        postLikes[_postId][msg.sender] = true;
        posts[_postId].likes += 1;

        emit PostLiked(_postId, msg.sender);
    }

    // =========================================================
    // TOKEN-GATED CHAT
    // =========================================================
    
    /**
     * @notice Send a message to a specific room (subject).
     * @dev Only the room owner or card holders can send messages.
     */
    function sendMessage(address room, string memory message) public {
        require(profiles[msg.sender].exists, "Identity not registered on the grid");
        require(bytes(message).length > 0, "Message cannot be empty");
        require(bytes(message).length <= MAX_POST_LENGTH, "Message too long");
        
        // Sender must either own a card of the room, or be the room owner
        require(keysBalance[room][msg.sender] > 0 || msg.sender == room, "Not a card holder for this room");

        emit RoomMessage(room, msg.sender, message, block.timestamp);
    }

    // =========================================================
    // CARD TRADING (Bonding Curve)
    // =========================================================

    function getPrice(uint256 supply, uint256 amount) public pure returns (uint256) {
        if (amount == 0) return 0;
        uint256 basePriceTotal = amount * 0.05 ether;
        uint256 sum1 = supply == 0 ? 0 : (supply - 1) * (supply) * (2 * (supply - 1) + 1) / 6;
        uint256 sum2 = supply == 0 && amount == 1 ? 0 : (supply - 1 + amount) * (supply + amount) * (2 * (supply - 1 + amount) + 1) / 6;
        uint256 summation = sum2 - sum1;
        uint256 curvePrice = summation * 1 ether / 100;
        return basePriceTotal + curvePrice;
    }

    function getBuyPrice(address subject, uint256 amount) public view returns (uint256) {
        return getPrice(keysSupply[subject], amount);
    }

    function getSellPrice(address subject, uint256 amount) public view returns (uint256) {
        return getPrice(keysSupply[subject] - amount, amount);
    }

    /**
     * @notice Buy one card of a subject.
     * @dev nonReentrant guard + CEI pattern:
     *      1. CHECKS  — validate conditions
     *      2. EFFECTS — update state
     *      3. INTERACTIONS — send ETH (last, after state is finalized)
     */
    function buyKey(address subject) public payable nonReentrant {
        require(profiles[subject].exists, "Subject identity not registered");
        uint256 supply = keysSupply[subject];
        require(supply > 0 || msg.sender == subject, "Only the subject can buy the first share");

        uint256 price = getPrice(supply, 1);
        require(msg.value >= price, "Insufficient payment");

        // EFFECTS — state changes BEFORE any external calls
        keysBalance[subject][msg.sender] += 1;
        keysSupply[subject] = supply + 1;
        uint256 refund = msg.value - price;

        emit Trade(msg.sender, subject, true, 1, price, supply + 1);

        // INTERACTIONS — ETH transfer is LAST
        if (refund > 0) {
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            require(success, "Refund transfer failed");
        }
    }

    /**
     * @notice Sell one card of a subject.
     * @dev nonReentrant guard + CEI pattern.
     *      Uses low-level call instead of transfer to avoid gas stipend issues.
     */
    function sellKey(address subject) public nonReentrant {
        uint256 supply = keysSupply[subject];
        require(supply > 1, "Cannot sell the last share");
        require(keysBalance[subject][msg.sender] >= 1, "Insufficient shares");

        uint256 price = getPrice(supply - 1, 1);

        // EFFECTS — state changes BEFORE any external calls
        keysBalance[subject][msg.sender] -= 1;
        keysSupply[subject] = supply - 1;

        emit Trade(msg.sender, subject, false, 1, price, supply - 1);

        // INTERACTIONS — ETH transfer is LAST
        (bool success, ) = payable(msg.sender).call{value: price}("");
        require(success, "Payment transfer failed");
    }

    // =========================================================
    // READ FUNCTIONS
    // =========================================================

    function getAllProfiles() public view returns (address[] memory, Profile[] memory) {
        uint256 count = registeredAddresses.length;
        Profile[] memory allProfiles = new Profile[](count);
        for (uint256 i = 0; i < count; i++) {
            allProfiles[i] = profiles[registeredAddresses[i]];
        }
        return (registeredAddresses, allProfiles);
    }

    function getRecentPosts(uint256 limit) public view returns (Post[] memory) {
        uint256 count = posts.length;
        if (count == 0) return new Post[](0);
        uint256 returnCount = count < limit ? count : limit;
        Post[] memory recentPosts = new Post[](returnCount);
        for (uint256 i = 0; i < returnCount; i++) {
            recentPosts[i] = posts[count - 1 - i];
        }
        return recentPosts;
    }

    function getProfileData(address subject, address viewer) public view returns (
        Profile memory profile,
        uint256 supply,
        uint256 viewerBalance,
        uint256 buyPrice,
        uint256 sellPrice
    ) {
        profile = profiles[subject];
        supply = keysSupply[subject];
        viewerBalance = keysBalance[subject][viewer];
        buyPrice = getBuyPrice(subject, 1);
        sellPrice = supply > 1 ? getSellPrice(subject, 1) : 0;
    }
}
