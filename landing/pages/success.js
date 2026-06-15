export default function Success() {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '80px auto',
        textAlign: 'center',
        padding: '0 20px',
      }}
    >
      <h1 style={{ color: '#16a34a', marginBottom: '16px' }}>Payment Successful!</h1>
      <p style={{ fontSize: '18px', color: '#374151', marginBottom: '8px' }}>
        Your StreamSalvage license key has been sent to your email.
      </p>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        Check your inbox and spam folder for an email from support@streamsalvage.com.
      </p>
      <a
        href="/"
        style={{
          background: '#16a34a',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        Back to StreamSalvage
      </a>
    </div>
  );
}
