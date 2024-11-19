// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Blockchain Voting System Interface
/// @notice Defines the structure for a transparent and secure voting system
/// @dev This is an interface, so functions are not implemented here
interface IVotingSystem {
    
    /// @notice Emitted when a voter is registered
    /// @param voter The address of the voter being registered
    event VoterRegistered(address voter);
    
    /// @notice Emitted when a vote is cast
    /// @param voter The address of the voter
    /// @param candidateId The ID of the candidate voted for
    event VoteCasted(
        address voter,
        uint candidateId
    );
    
    /// @notice Emitted when an election starts
    event ElectionStarted();
    
    /// @notice Emitted when an election ends
    event ElectionEnded();

    /// @notice Registers a voter
    /// @param _voter The address of the voter
    function registerVoter(address _voter) external;

    /// @notice Starts the election process
    function startElection() external;

    /// @notice Allows a registered voter to cast their vote
    /// @param _candidateId The ID of the candidate to vote for
    function castVote(uint _candidateId) external;

    /// @notice Ends the election process
    function endElection() external;

    /// @notice Retrieves the election results
    /// @return An array of vote counts for each candidate
    function viewResults() 
        external 
        view 
        returns (uint[] memory);
}
