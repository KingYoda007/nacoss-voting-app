import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Auto dismiss after 3 seconds
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle size={20} color="#22c55e" />,
        error: <XCircle size={20} color="#ef4444" />,
        info: <Info size={20} color="#3b82f6" />
    };

    const bgColors = {
        success: 'rgba(240, 253, 244, 0.95)',
        error: 'rgba(254, 242, 242, 0.95)',
        info: 'rgba(239, 246, 255, 0.95)'
    };

    const borders = {
        success: '1px solid #bbf7d0',
        error: '1px solid #fecaca',
        info: '1px solid #bfdbfe'
    };

    return (
        <div className="toast-item animate-slide-in">
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-message">{message}</div>
            <button onClick={onClose} className="toast-close"><X size={16} /></button>

            <style>{`
                .toast-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    background: ${bgColors[type]};
                    border: ${borders[type]};
                    border-left: 4px solid ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    min-width: 300px;
                    max-width: 450px;
                    pointer-events: auto;
                    backdrop-filter: blur(4px);
                    margin-bottom: 10px;
                }
                .toast-message {
                    flex: 1;
                    font-size: 0.95rem;
                    color: #1e293b;
                    font-weight: 500;
                }
                .toast-close {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    transition: color 0.2s;
                }
                .toast-close:hover { color: #0f172a; }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};

export default Toast;
