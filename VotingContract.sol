// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IVotingSystem.sol";

/// @title Blockchain Voting System
/// @notice Implements a secure and transparent voting system
contract VotingContract is IVotingSystem {
    // State variables
    address public owner; // Address of the contract owner
    uint public candidateCount; // Tracks the total number of candidates
    bool public electionOngoing; // Indicates if the election is currently active

    /// @notice Defines the phases of an election
    /// @dev Ensures the election progresses in a structured way
    enum ElectionPhase { NotStarted, Registration, Voting, Ended }
    ElectionPhase public phase; // Current phase of the election

    mapping(uint => string) public candidates; // Maps candidate IDs to their names
    mapping(string => bool) public approvedWriteIns; // Tracks approved write-in candidates
    mapping(address => bool) public hasVoted; // Tracks whether an address has already voted
    mapping(uint => uint) public votes; // Tracks votes for each candidate by ID

    /// @notice Initializes the contract and sets the owner
    constructor() {
        owner = msg.sender;
        phase = ElectionPhase.NotStarted;
    }

    /// @notice Restricts function access to the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    /// @notice Restricts functions to specific election phases
    /// @param _phase The required phase for the function to execute
    modifier inPhase(ElectionPhase _phase) {
        require(phase == _phase, "Invalid phase for this action");
        _;
    }

    /// @notice Registers a voter (stub function for demonstration purposes)
    /// @param _voter Address of the voter
    function registerVoter(address _voter) external override {
        // For demonstration purposes, no implementation
        emit VoterRegistered(_voter);
    }

    /// @notice Sets the current phase of the election
    /// @param _phase The phase to transition to
    function setPhase(ElectionPhase _phase) external onlyOwner {
        require(phase != ElectionPhase.Ended, "Election has ended");
        phase = _phase;
    }

    /// @notice Adds a new candidate during the registration phase
    /// @param _name The name of the candidate
    function addCandidate(string memory _name) external onlyOwner inPhase(ElectionPhase.Registration) {
        candidateCount++;
        candidates[candidateCount] = _name;
        emit CandidateAdded(candidateCount, _name);
    }

    /// @notice Approves a write-in candidate during the registration phase
    /// @param _name The name of the write-in candidate
    function approveWriteIn(string memory _name) external onlyOwner inPhase(ElectionPhase.Registration) {
        approvedWriteIns[_name] = true;
        emit WriteInApproved(_name);
    }

    /// @notice Starts the election, transitioning to the voting phase
    function startElection() external onlyOwner inPhase(ElectionPhase.Registration) {
        require(candidateCount > 0, "No candidates to start the election");
        phase = ElectionPhase.Voting;
        electionOngoing = true;
        emit ElectionStarted();
    }

    /// @notice Allows a voter to cast their vote
    /// @param _candidateId The ID of the candidate to vote for
    function castVote(uint _candidateId) external inPhase(ElectionPhase.Voting) {
        require(!hasVoted[msg.sender], "You have already voted");
        require(
            (_candidateId > 0 && _candidateId <= candidateCount) ||
            approvedWriteIns[candidates[_candidateId]],
            "Invalid candidate ID"
        );

        votes[_candidateId]++;
        hasVoted[msg.sender] = true;
        emit VoteCasted(msg.sender, _candidateId);
    }

    /// @notice Ends the election, transitioning to the ended phase
    function endElection() external onlyOwner inPhase(ElectionPhase.Voting) {
        phase = ElectionPhase.Ended;
        electionOngoing = false;
        emit ElectionEnded();
    }

    /// @notice Retrieves results for a specific candidate
    /// @param _candidateId The ID of the candidate
    /// @return The number of votes for the candidate
    function getResults(uint _candidateId) external view inPhase(ElectionPhase.Ended) returns (uint) {
        require(_candidateId > 0 && _candidateId <= candidateCount, "Invalid candidate ID");
        return votes[_candidateId];
    }

    /// @notice Retrieves results for all candidates
    /// @return Arrays containing candidate names and their respective vote counts
    function getAllResults() external view inPhase(ElectionPhase.Ended) returns (string[] memory, uint[] memory) {
        string[] memory candidateNames = new string[](candidateCount);
        uint[] memory candidateVotes = new uint[](candidateCount);

        for (uint i = 1; i <= candidateCount; i++) {
            candidateNames[i - 1] = candidates[i];
            candidateVotes[i - 1] = votes[i];
        }

        return (candidateNames, candidateVotes);
    }

    /// @notice Retrieves results for a range of candidates
    /// @param start The starting candidate ID (inclusive)
    /// @param end The ending candidate ID (inclusive)
    /// @return Arrays containing candidate names and their respective vote counts
    function getResultsByRange(uint start, uint end) external view inPhase(ElectionPhase.Ended) returns (string[] memory, uint[] memory) {
        require(start > 0 && end <= candidateCount && start <= end, "Invalid range");
        uint rangeSize = end - start + 1;

        string[] memory candidateNames = new string[](rangeSize);
        uint[] memory candidateVotes = new uint[](rangeSize);

        for (uint i = start; i <= end; i++) {
            candidateNames[i - start] = candidates[i];
            candidateVotes[i - start] = votes[i];
        }

        return (candidateNames, candidateVotes);
    }
}
