export default function ChannelBadge({ thumbnailUrl, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.9)',
        background: '#EDE8E2',
        padding: 0,
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="channel"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ fontSize: '16px' }}>📺</span>
      )}
    </button>
  )
}
