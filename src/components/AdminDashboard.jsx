import React, { useState, useContext } from 'react';
import { useContract } from '../hooks/useContract';
import { Web3Context } from '../context/Web3Context';
import { ethers } from 'ethers';

const AdminDashboard = () => {
    const { currentAccount } = useContext(Web3Context);
    const contract = useContract();

    // Form States
    const [electionName, setElectionName] = useState("");
    const [electionStart, setElectionStart] = useState("");
    const [electionEnd, setElectionEnd] = useState("");

    const [positionName, setPositionName] = useState("");
    const [electionIdForPosition, setElectionIdForPosition] = useState("");

    const [candidateName, setCandidateName] = useState("");
    const [candidateInfo, setCandidateInfo] = useState("");
    const [candidateImg, setCandidateImg] = useState("");
    const [positionIdForCandidate, setPositionIdForCandidate] = useState("");

    // List state
    const [electionsList, setElectionsList] = useState([]);

    useEffect(() => {
        if (contract) fetchElections();
    }, [contract]);

    const fetchElections = async () => {
        try {
            const count = await contract.electionCounter();
            const list = [];
            for (let i = 1; i <= count; i++) {
                const election = await contract.getElectionDetails(i);
                list.push(election);
            }
            setElectionsList(list);
        } catch (error) { console.error("Error fetching elections:", error); }
    };

    const createElection = async () => {
        if (!contract) return;
        try {
            // Convert date strings to unix timestamp
            const start = Math.floor(new Date(electionStart).getTime() / 1000);
            const end = Math.floor(new Date(electionEnd).getTime() / 1000);

            const tx = await contract.createElection(electionName, start, end);
            await tx.wait();
            alert("Election Created!");
            setElectionName("");
            fetchElections();
        } catch (error) {
            console.error(error);
            alert("Error creating election");
        }
    };

    const addPosition = async () => {
        if (!contract) return;
        try {
            const tx = await contract.addPosition(electionIdForPosition, positionName);
            await tx.wait();
            alert("Position Added!");
            setPositionName("");
        } catch (error) {
            console.error(error);
            alert("Error adding position");
        }
    }

    const addCandidate = async () => {
        if (!contract) return;
        try {
            const tx = await contract.addCandidate(positionIdForCandidate, candidateName, candidateInfo, candidateImg);
            await tx.wait();
            alert("Candidate Added!");
            setCandidateName("");
            setCandidateInfo("");
            setCandidateImg("");
        } catch (error) {
            console.error(error);
            alert("Error adding candidate");
        }
    }

    return (
        <div className="admin-dashboard">
            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Create Election</h3>
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <input className="input-field" placeholder="Election Name" value={electionName} onChange={(e) => setElectionName(e.target.value)} />
                <input className="input-field" type="datetime-local" value={electionStart} onChange={(e) => setElectionStart(e.target.value)} />
                <input className="input-field" type="datetime-local" value={electionEnd} onChange={(e) => setElectionEnd(e.target.value)} />
                <button className="btn-primary" onClick={createElection}>Create Election</button>
            </div>

            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Existing Elections</h3>
            <div className="elections-list" style={{ marginBottom: '20px' }}>
                {electionsList.map(e => (
                    <div key={e.id} className="glass-panel" style={{ marginBottom: '10px', padding: '1rem' }}>
                        <div><strong>ID:</strong> {e.id.toString()} | <strong>Name:</strong> {e.name}</div>
                        <div>Status: {e.isActive ? 'Active' : 'Inactive'}</div>
                        <button className="btn-primary" style={{ marginTop: '10px', fontSize: '0.8rem' }} onClick={() => setElectionIdForPosition(e.id)}>Select for Managing</button>
                    </div>
                ))}
            </div>

            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Manage Selected Election {electionIdForPosition && `(ID: ${electionIdForPosition})`}</h3>

            <div className="form-group" style={{ marginBottom: '20px' }}>
                <input className="input-field" placeholder="Election ID" value={electionIdForPosition} onChange={(e) => setElectionIdForPosition(e.target.value)} />
                <input className="input-field" placeholder="Position Name (e.g. President)" value={positionName} onChange={(e) => setPositionName(e.target.value)} />
                <button className="btn-primary" onClick={addPosition}>Add Position</button>
            </div>

            <h3 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Add Candidate</h3>
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <input className="input-field" placeholder="Position ID" value={positionIdForCandidate} onChange={(e) => setPositionIdForCandidate(e.target.value)} />
                <input className="input-field" placeholder="Candidate Name" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
                <input className="input-field" placeholder="Manifesto/Info" value={candidateInfo} onChange={(e) => setCandidateInfo(e.target.value)} />
                <input className="input-field" placeholder="Image URL (IPFS)" value={candidateImg} onChange={(e) => setCandidateImg(e.target.value)} />
                <button className="btn-primary" onClick={addCandidate}>Add Candidate</button>
            </div>
            <style>{`
                .input-field {
                    display: block;
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    border: 1px solid var(--glass-border);
                    background: rgba(0,0,0,0.2);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
