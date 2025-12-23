import React from 'react';

interface TerminalProps {
    logs: string[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
    const bottomRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="terminal-window">
            <div className="terminal-header">
                <div className="terminal-dot red"></div>
                <div className="terminal-dot yellow"></div>
                <div className="terminal-dot green"></div>
                <span className="terminal-title">ingress.log</span>
            </div>
            <div className="terminal-body">
                {logs.length === 0 && <div className="log-line dim">Waiting for connections...</div>}
                {logs.map((log, i) => (
                    <div key={i} className="log-line">
                        <span className="log-ts">{log.split(']')[0]}]</span>
                        <span className="log-msg">{log.split(']').slice(1).join(']')}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

