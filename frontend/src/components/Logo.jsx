import './Logo.css';

function Logo({ size = 'medium' }) {
  return (
    <div className={`logo logo-${size}`}>
      <img src="/assets/logo.svg" alt="Grupo Dilus" className="logo-img" />
    </div>
  );
}

export default Logo;



