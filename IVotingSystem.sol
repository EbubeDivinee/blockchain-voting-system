// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Blockchain Voting System Interface
/// @notice Defines the structure for a transparent and secure voting system
/// @dev This is an interface, so functions are not implemented here
interface IVotingSystem {
    /// @notice Emitted when a voter registers
    /// @param voter Address of the voter
    event VoterRegistered(address voter);

    /// @notice Emitted when a vote is cast
    /// @param voter Address of the voter
    /// @param candidateId ID of the candidate voted for
    event VoteCasted(address voter, uint candidateId);

    /// @notice Emitted when the election starts
    event ElectionStarted();

    /// @notice Emitted when the election ends
    event ElectionEnded();

    /// @notice Emitted when a candidate is added
    /// @param candidateId ID of the candidate added
    /// @param name Name of the candidate
    event CandidateAdded(uint candidateId, string name);

    /// @notice Emitted when a write-in candidate is approved
    /// @param name Name of the approved write-in candidate
    event WriteInApproved(string name);

    /// @notice Registers a voter
    /// @param _voter Address of the voter
    function registerVoter(address _voter) external;

    /// @notice Starts the election
    function startElection() external;

    /// @notice Casts a vote for a candidate
    /// @param _candidateId ID of the candidate to vote for
    function castVote(uint _candidateId) external;

    /// @notice Ends the election
    function endElection() external;

    /// @notice Retrieves results for a specific candidate
    /// @param _candidateId ID of the candidate
    /// @return Number of votes for the candidate
    function getResults(uint _candidateId) external view returns (uint);

    /// @notice Retrieves results for all candidates
    /// @return Arrays of candidate names and their vote counts
    function getAllResults() external view returns (string[] memory, uint[] memory);
}
