import { useLocation, useNavigate } from 'react-router-dom';

function Notification() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const records = location.state?.records || [];
  const excelData = location.state?.excelData || [];
  const fileName = location.state?.fileName || '';

  const groupRecords = (records) => {
    const now = new Date();
    const threeDays = new Date(now);
    threeDays.setDate(now.getDate() + 3);

    const oneWeek = new Date(now);
    oneWeek.setDate(now.getDate() + 7);

    const groups = {
      threeDays: [],
      oneWeek: [],
    };

    records.forEach(record => {
      const dateKey = Object.keys(record).find(k => k.toLowerCase().includes('date'));
      const expiryDate = new Date(record[dateKey]);
      if (expiryDate <= threeDays) {
        groups.threeDays.push(record);
      } else if (expiryDate <= oneWeek) {
        groups.oneWeek.push(record);
      } 
    });

    return groups;
  };

const grouped = groupRecords(records);
const handleGoBack = () => {
navigate('/', { 
    state: { 
    excelData: location.state?.excelData || [],
    fileName: location.state?.fileName || ''
    } 
});
};




  const renderGroup = (title, items, color) => (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ color }}>{title}</h2>
      {items.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {items.map((record, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'darkgray',
                padding: '1rem',
                borderRadius: '10px',
                minWidth: '250px',
                color: '#171717',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {Object.entries(record).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value}</p>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#999' }}>No records</p>
      )}
    </div>
  );

    return (
    <div style={{ padding: '2rem' }}>
        <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem', // Added space below the header
        gap: '2rem' // Added space between title and button
        }}>
        <h1 style={{ margin: 0 }}>Notification Page</h1> {/* Remove default h1 margin */}
        <button 
            onClick={handleGoBack}
            style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            whiteSpace: 'nowrap' // Prevent button text from wrapping
            }}
        >
            Back to Excel Reader
        </button>
        </div>
        {renderGroup('Expiring in 3 Days', grouped.threeDays, 'red')}
        {renderGroup('Expiring in 1 Week', grouped.oneWeek, 'orange')}
    </div>
    );
}

export default Notification;