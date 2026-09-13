// @ts-nocheck
function Error({ statusCode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#05050f', color: '#fff', fontFamily: 'system-ui' }}>
      <h1>{statusCode || 'Error'}</h1>
    </div>
  );
}
Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
export default Error;
