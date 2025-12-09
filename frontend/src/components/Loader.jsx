import './Loader.css';

function Loader({ message = 'Cargando...' }) {
  return (
    <div className="loader-container">
      <div className="loader"></div>
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
}

export default Loader;



