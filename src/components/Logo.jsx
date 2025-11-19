import PropTypes from 'prop-types';

/**
 * Logo component - Reusable app logo with icon and text
 *
 * @param {Object} props
 * @param {string} props.variant - Variant of the logo ('header' or 'home')
 * @param {string} props.className - Additional CSS class name
 */
function Logo({ variant = 'header', className = '' }) {
  const isHome = variant === 'home';

  return (
    <div className={`${isHome ? 'home-logo' : 'app-logo-content'} ${className}`.trim()}>
      <div className={isHome ? 'home-logo-square' : 'logo-square'}></div>
      {isHome ? (
        <h1 className="home-logo-text">AnimatedLLM</h1>
      ) : (
        <div className="logo-text">AnimatedLLM</div>
      )}
    </div>
  );
}

Logo.propTypes = {
  variant: PropTypes.oneOf(['header', 'home']),
  className: PropTypes.string,
};

export default Logo;
