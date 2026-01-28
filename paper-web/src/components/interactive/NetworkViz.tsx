/**
 * Network Visualization Component
 * Animated P2P network showing node connections and consensus
 */

import React, { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  connections: string[];
}

export const NetworkViz: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  // Initialize nodes
  useEffect(() => {
    const nodeCount = 50;
    const newNodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      newNodes.push({
        id: `node-${i}`,
        x: Math.random() * 800,
        y: Math.random() * 500,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 2,
        color: i % 3 === 0 ? '#667eea' : i % 3 === 1 ? '#764ba2' : '#f5576c',
        connections: []
      });
    }

    // Create connections (each node connects to 3-5 random nodes)
    newNodes.forEach(node => {
      const connectionCount = Math.floor(Math.random() * 3) + 3;
      const availableNodes = newNodes.filter(n => n.id !== node.id);
      
      for (let i = 0; i < connectionCount && i < availableNodes.length; i++) {
        const randomNode = availableNodes[Math.floor(Math.random() * availableNodes.length)];
        if (!node.connections.includes(randomNode.id)) {
          node.connections.push(randomNode.id);
        }
      }
    });

    setNodes(newNodes);
    setIsAnimating(true);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isAnimating || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw nodes
      setNodes(prevNodes => {
        const updatedNodes = prevNodes.map(node => {
          // Update position
          let newX = node.x + node.vx;
          let newY = node.y + node.vy;
          let newVx = node.vx;
          let newVy = node.vy;

          // Bounce off walls
          if (newX < 0 || newX > canvas.width) {
            newVx = -newVx;
            newX = newX < 0 ? 0 : canvas.width;
          }
          if (newY < 0 || newY > canvas.height) {
            newVy = -newVy;
            newY = newY < 0 ? 0 : canvas.height;
          }

          return {
            ...node,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          };
        });

        // Draw connections
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
        ctx.lineWidth = 1;
        updatedNodes.forEach(node => {
          node.connections.forEach(connId => {
            const targetNode = updatedNodes.find(n => n.id === connId);
            if (targetNode) {
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(targetNode.x, targetNode.y);
              ctx.stroke();
            }
          });
        });

        // Draw nodes
        updatedNodes.forEach(node => {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();
          
          // Glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = node.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        return updatedNodes;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  return (
    <div className="network-viz">
      <div className="network-viz-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="network-viz-canvas"
        />
        <div className="network-viz-overlay">
          <div className="network-viz-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#667eea' }}></span>
              <span>Active Nodes</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#764ba2' }}></span>
              <span>Consensus Peers</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#f5576c' }}></span>
              <span>Bootstrap Nodes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="network-viz-info">
        <div className="network-info-card">
          <div className="network-info-icon">🌐</div>
          <div className="network-info-content">
            <div className="network-info-label">Network Topology</div>
            <div className="network-info-value">Distributed P2P Mesh</div>
          </div>
        </div>
        <div className="network-info-card">
          <div className="network-info-icon">⚡</div>
          <div className="network-info-content">
            <div className="network-info-label">Consensus Protocol</div>
            <div className="network-info-value">DHT + PKARR</div>
          </div>
        </div>
        <div className="network-info-card">
          <div className="network-info-icon">🔗</div>
          <div className="network-info-content">
            <div className="network-info-label">Transport Layer</div>
            <div className="network-info-value">WebRTC + libp2p</div>
          </div>
        </div>
      </div>

      <div className="network-viz-description">
        <h4>How Global Consensus Works</h4>
        <ol>
          <li><strong>Register Domain:</strong> User creates mysite.paper with Ed25519 keypair</li>
          <li><strong>Publish to DHT:</strong> Domain record broadcast to distributed hash table</li>
          <li><strong>Peer Verification:</strong> 1,500+ nodes verify cryptographic signature</li>
          <li><strong>Consensus Achieved:</strong> 97%+ agreement confirms domain is live</li>
          <li><strong>Global Resolution:</strong> Anyone can resolve mysite.paper to same content</li>
        </ol>
        <p className="network-viz-note">
          Total time: <strong>5-10 seconds</strong> · Traditional DNS: <strong>24-48 hours</strong>
        </p>
      </div>
    </div>
  );
};

export default NetworkViz;
