const MyLoans = () => {
  const loans = [
    { id: 1, title: 'Nutuk', loanDate: '2023-10-01', returnDate: '2023-10-15', status: 'Teslim Edildi' },
    { id: 2, title: 'Sefiller', loanDate: '2023-11-20', returnDate: '2023-12-05', status: 'Elinizde' },
  ];

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif' }}>
      <h2>Ödünç Aldığım Kitaplar</h2>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4' }}>
            <th>Kitap Adı</th>
            <th>Alış Tarihi</th>
            <th>Son İade Tarihi</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {loans.map(loan => (
            <tr key={loan.id} style={{ textAlign: 'center' }}>
              <td style={{ padding: '10px' }}>{loan.title}</td>
              <td>{loan.loanDate}</td>
              <td>{loan.returnDate}</td>
              <td style={{ color: loan.status === 'Elinizde' ? 'green' : 'gray' }}>{loan.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MyLoans;