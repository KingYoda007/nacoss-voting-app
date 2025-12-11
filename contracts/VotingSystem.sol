// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSystem {
    struct Candidate {
        uint256 id;
        string name;
        string info; // manifesto or other details
        uint256 voteCount;
        string ipfsImageUrl; // For candidate photo
    }

    struct Position {
        uint256 id;
        string name;
        uint256[] candidateIds;
        bool exists;
    }

    struct Election {
        uint256 id;
        string name;
        bool isActive;
        uint256 startTime;
        uint256 endTime;
        uint256[] positionIds;
    }

    struct Voter {
        bool isRegistered;
        bool hasVoted; // Simple check, needs refinement for multi-position
        mapping(uint256 => bool) votedPositions; // positionId => hasVoted
    }

    address public owner;
    uint256 public candidateCounter;
    uint256 public positionCounter;
    uint256 public electionCounter;

    mapping(uint256 => Election) public elections;
    mapping(uint256 => Position) public positions;
    mapping(uint256 => Candidate) public candidates;
    mapping(address => Voter) public voters;

    event ElectionCreated(uint256 indexed electionId, string name);
    event ElectionStatusChanged(uint256 indexed electionId, bool isActive);
    event VoterRegistered(address indexed voter);
    event VoteCast(address indexed voter, uint256 indexed electionId, uint256 indexed positionId, uint256 candidateId);
    event PositionAdded(uint256 indexed electionId, uint256 positionId, string name);
    event CandidateAdded(uint256 indexed positionId, uint256 candidateId, string name);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Not a registered voter");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // --- Admin Functions ---

    function createElection(string memory _name, uint256 _startTime, uint256 _endTime) public onlyOwner returns(uint256) {
        electionCounter++;
        Election storage newElection = elections[electionCounter];
        newElection.id = electionCounter;
        newElection.name = _name;
        newElection.startTime = _startTime;
        newElection.endTime = _endTime;
        newElection.isActive = true; // Can be toggled

        emit ElectionCreated(electionCounter, _name);
        return electionCounter;
    }

    function addPosition(uint256 _electionId, string memory _name) public onlyOwner returns(uint256) {
        require(elections[_electionId].id != 0, "Election does not exist");
        
        positionCounter++;
        Position storage newPosition = positions[positionCounter];
        newPosition.id = positionCounter;
        newPosition.name = _name;
        newPosition.exists = true;

        elections[_electionId].positionIds.push(positionCounter);
        
        emit PositionAdded(_electionId, positionCounter, _name);
        return positionCounter;
    }

    function addCandidate(uint256 _positionId, string memory _name, string memory _info, string memory _ipfsImageUrl) public onlyOwner returns(uint256) {
        require(positions[_positionId].exists, "Position does not exist");

        candidateCounter++;
        Candidate storage newCandidate = candidates[candidateCounter];
        newCandidate.id = candidateCounter;
        newCandidate.name = _name;
        newCandidate.info = _info;
        newCandidate.ipfsImageUrl = _ipfsImageUrl;

        positions[_positionId].candidateIds.push(candidateCounter);

        emit CandidateAdded(_positionId, candidateCounter, _name);
        return candidateCounter;
    }

    function registerVoters(address[] memory _voters) public onlyOwner {
        for(uint i = 0; i < _voters.length; i++) {
            voters[_voters[i]].isRegistered = true;
            emit VoterRegistered(_voters[i]);
        }
    }

    function toggleElectionStatus(uint256 _electionId, bool _isActive) public onlyOwner {
        require(elections[_electionId].id != 0, "Election does not exist");
        elections[_electionId].isActive = _isActive;
        emit ElectionStatusChanged(_electionId, _isActive);
    }

    // --- Voter Functions ---

    function castVote(uint256 _electionId, uint256 _positionId, uint256 _candidateId) public onlyRegisteredVoter {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election is not active");
        // require(block.timestamp >= election.startTime && block.timestamp <= election.endTime, "Election is not currently open");
        // Commenting out time check for easier testing, uncomment for production

        require(positions[_positionId].exists, "Position does not exist");
        require(!voters[msg.sender].votedPositions[_positionId], "Already voted for this position");

        // Verify candidate belongs to position
        bool validCandidate = false;
        Position storage position = positions[_positionId];
        for(uint i = 0; i < position.candidateIds.length; i++) {
            if(position.candidateIds[i] == _candidateId) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate for this position");

        // Record vote
        voters[msg.sender].votedPositions[_positionId] = true;
        candidates[_candidateId].voteCount++;

        emit VoteCast(msg.sender, _electionId, _positionId, _candidateId);
    }

    // --- View Functions ---

    function getElectionDetails(uint256 _electionId) public view returns (Election memory) {
         return elections[_electionId];
    }
    
    function getPositionIds(uint256 _electionId) public view returns (uint256[] memory) {
        return elections[_electionId].positionIds;
    }

    function getCandidateIds(uint256 _positionId) public view returns (uint256[] memory) {
        return positions[_positionId].candidateIds;
    }

    function getCandidate(uint256 _candidateId) public view returns (Candidate memory) {
        return candidates[_candidateId];
    }
    
    function getPosition(uint256 _positionId) public view returns (Position memory) {
        return positions[_positionId];
    }

    function hasVoted(address _voter, uint256 _positionId) public view returns (bool) {
        return voters[_voter].votedPositions[_positionId];
    }
}
