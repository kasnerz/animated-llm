import PropTypes from 'prop-types';
import logoImage from '../assets/logo.png';
import iconImage from '../assets/icon.png';

/**
 * Logo component - Reusable app logo with icon and text
 *
 * @param {Object} props
 * @param {string} props.variant - Variant of the logo ('header' or 'home')
 * @param {string} props.className - Additional CSS class name
 */
function Logo({ variant = 'header', className = '' }) {
  const isHome = variant === 'home';
  const Wrapper = isHome ? 'h1' : 'div';

  return (
    <Wrapper className={`${isHome ? 'home-logo' : 'app-logo-content'} ${className}`.trim()}>
      <img
        src={isHome ? logoImage : iconImage}
        alt="AnimatedLLM"
        className={isHome ? 'home-logo-image' : 'logo-image'}
      />
    </Wrapper>
  );
}

Logo.propTypes = {
  variant: PropTypes.oneOf(['header', 'home']),
  className: PropTypes.string,
};

export default Logo;
