import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Minimize2 } from 'lucide-react';
import { runtime } from '../../lib/runtime';

export const WebVMTerminal = () => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>(['Welcome to WebVM Terminal v1.0', 'Type "help" for commands.']);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, open]);

    const execute = async (cmd: string) => {
        const args = cmd.trim().split(' ');
        const command = args[0].toLowerCase();
        
        let output = '';

        switch (command) {
            case 'help':
                output = 'Available commands: ls, cat <file>, curl <url>, clear, whoami, uname';
                break;
            case 'clear':
                setHistory([]);
                return;
            case 'ls':
                output = runtime.listFiles().join('\n');
                if (!output) output = '(empty)';
                break;
            case 'cat':
                if (!args[1]) { output = 'Usage: cat <file>'; break; }
                // We don't have direct access to fs content via public runtime method for security/simplicity
                // But we can try to fetch it via the runtime handler
                try {
                    const res = await runtime.handleRequest('localhost', args[1]);
                    output = res.status === 200 ? res.body.slice(0, 500) + (res.body.length > 500 ? '...' : '') : `Error: ${res.status}`;
                } catch (e) { output = `Error: ${e}`; }
                break;
            case 'curl':
                if (!args[1]) { output = 'Usage: curl <url>'; break; }
                output = `Fetching ${args[1]}... (Mock)`;
                // In real app, we'd use fetch proxy
                break;
            case 'whoami':
                output = 'webvm-user';
                break;
            case 'uname':
                output = 'Linux WebVM 5.15.0 (WASM)';
                break;
            default:
                if (cmd.trim()) output = `command not found: ${command}`;
        }

        setHistory(prev => [...prev, `$ ${cmd}`, output].filter(Boolean));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            execute(input);
            setInput('');
        }
    };

    if (!open) {
        return (
            <button 
                onClick={() => setOpen(true)}
                style={{
                    position: 'fixed', bottom: '20px', right: '20px',
                    background: '#000', color: '#fff', border: '1px solid #333',
                    padding: '10px', borderRadius: '50%', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 3000
                }}
            >
                <TerminalIcon size={20} />
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed', bottom: '20px', right: '20px',
            width: '600px', height: '400px',
            background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
            border: '1px solid #333', borderRadius: '8px',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 3000,
            fontFamily: 'monospace', fontSize: '14px', color: '#0f0'
        }}>
            <div style={{
                padding: '8px 12px', background: '#111', borderBottom: '1px solid #333',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <span style={{ color: '#888' }}>webvm@paper:~/</span>
                <button 
                    onClick={() => setOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                >
                    <Minimize2 size={16} />
                </button>
            </div>
            
            <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
                {history.map((line, i) => (
                    <div key={i} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap' }}>{line}</div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div style={{ padding: '8px 12px', borderTop: '1px solid #333', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#0070f3' }}>➜</span>
                <input 
                    autoFocus
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: '#fff', fontFamily: 'inherit'
                    }}
                />
            </div>
        </div>
    );
};
