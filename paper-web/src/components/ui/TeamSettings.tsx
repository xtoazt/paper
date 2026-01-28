/**
 * Team Settings Component
 * Manage team members and permissions
 */

export function TeamSettings({ projectId }: { projectId: string | null }) {
  const team = [
    { name: 'You', email: 'you@example.com', role: 'Owner', avatar: '👤' },
    { name: 'Alice', email: 'alice@example.com', role: 'Admin', avatar: '👩' },
    { name: 'Bob', email: 'bob@example.com', role: 'Developer', avatar: '👨' }
  ];

  return (
    <div className="team-settings">
      <h2>Team Members</h2>

      <div className="invite-section">
        <input type="email" placeholder="email@example.com" className="invite-input" />
        <select className="role-select">
          <option>Developer</option>
          <option>Admin</option>
        </select>
        <button className="invite-btn">Invite</button>
      </div>

      <div className="team-list">
        {team.map((member, index) => (
          <div key={index} className="team-member">
            <div className="member-avatar">{member.avatar}</div>
            <div className="member-info">
              <span className="member-name">{member.name}</span>
              <span className="member-email">{member.email}</span>
            </div>
            <span className="member-role">{member.role}</span>
            {member.role !== 'Owner' && (
              <button className="remove-btn">Remove</button>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .team-settings {
          padding: 2rem;
          margin-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .team-settings h2 {
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .invite-section {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .invite-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }

        .role-select {
          padding: 0.75rem 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
        }

        .invite-btn {
          padding: 0.75rem 1.5rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .team-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .team-member {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .member-avatar {
          font-size: 2rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 50%;
        }

        .member-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .member-name {
          font-weight: 600;
        }

        .member-email {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .member-role {
          padding: 0.25rem 0.75rem;
          background: #e0e7ff;
          color: #4338ca;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .remove-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #fee2e2;
          color: #ef4444;
          background: white;
          border-radius: 6px;
          cursor: pointer;
        }

        .remove-btn:hover {
          background: #fee2e2;
        }
      `}</style>
    </div>
  );
}
