// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Blockchain Voting System
/// @notice Implements a secure and transparent voting system
contract VotingContract {
    // State variables
    address public owner;
    uint public candidateCount; // Tracks the total number of candidates
    bool public electionOngoing;

    mapping(uint => string) public candidates; // Pre-registered candidates
    mapping(string => bool) public approvedWriteIns; // Approved write-ins
    mapping(address => bool) public hasVoted; // Tracks whether an address has voted
    mapping(uint => uint) public votes; // Tracks votes for each candidate

    /// @notice Emitted when a voter is registered
    event VoterRegistered(address voter);

    /// @notice Emitted when a vote is cast
    event VoteCasted(address voter, uint candidateId);

    /// @notice Emitted when the election starts
    event ElectionStarted();

    /// @notice Emitted when the election ends
    event ElectionEnded();

    /// @dev Sets the deployer as the contract owner
    constructor() {
        owner = msg.sender;
    }

    /// @notice Adds a new candidate (write-in or predefined)
    /// @param _name The name of the candidate to add
    function addCandidate(string memory _name) external onlyOwner {
        require(!electionOngoing, "Cannot add candidates during an election");
        candidateCount++;
        candidates[candidateCount] = _name;
    }

    function approveWriteIn(string memory _name) external onlyOwner {
        approvedWriteIns[_name] = true;
    }

    /// @notice Starts the election process
    function startElection() external onlyOwner {
        require(candidateCount > 0, "No candidates to start the election");
        electionOngoing = true;
        emit ElectionStarted();
    }

    /// @notice Ends the election process
    function endElection() external onlyOwner {
        require(electionOngoing, "Election is not ongoing");
        electionOngoing = false;
        emit ElectionEnded();
    }

    /// @notice Registers a vote for a candidate
    /// @param _candidateId The ID of the candidate to vote for
    function castVote(uint _candidateId) external {
        require(electionOngoing, "Election is not ongoing");
        require(!hasVoted[msg.sender], "You have already voted");

        if (_candidateId > 0 && _candidateId <= candidateCount) {
            // Voting for a pre-registered candidate
            votes[_candidateId]++;
        } else if (approvedWriteIns[candidates[_candidateId]]) {
            // Voting for an approved write-in candidate
            votes[_candidateId]++;
        } else {
            revert("Invalid candidate ID");
        }

        hasVoted[msg.sender] = true;
        emit VoteCasted(msg.sender, _candidateId);
    }

    /// @notice Retrieves election results for a candidate
    /// @param _candidateId The ID of the candidate to query
    /// @return The number of votes received by the candidate
    function getResults(uint _candidateId) external view returns (uint) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        return votes[_candidateId];
    }

    /// @notice Retrieves all candidates and their votes
    /// @return Arrays containing candidate names and their respective vote counts
    function getAllResults() external view returns (string[] memory, uint[] memory) {
        string[] memory candidateNames = new string[](candidateCount);
        uint[] memory candidateVotes = new uint[](candidateCount);

        for (uint i = 1; i <= candidateCount; i++) {
            candidateNames[i - 1] = candidates[i];
            candidateVotes[i - 1] = votes[i];
        }

        return (candidateNames, candidateVotes);
    }

    /// @dev Restricts certain functions to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }
}
