/* @ds-bundle: {"format":3,"namespace":"VelioraDesignSystem_a4b5e5","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"SectionTitle","sourcePath":"components/core/SectionTitle.jsx"},{"name":"StatItem","sourcePath":"components/core/StatItem.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"b8838ebdac34","components/core/Button.jsx":"d2c3a823af7f","components/core/Card.jsx":"7a304e4e7aaa","components/core/Input.jsx":"a26ecc1f8972","components/core/SectionTitle.jsx":"6fec6bb5b4a2","components/core/StatItem.jsx":"0c122b53ca1b"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.VelioraDesignSystem_a4b5e5 = window.VelioraDesignSystem_a4b5e5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function Badge({
  children,
  variant = 'default'
}) {
  const variants = {
    default: {
      background: 'var(--surface-subtle)',
      color: 'var(--text-secondary)',
      border: 'var(--border)'
    },
    dark: {
      background: 'var(--surface-invert)',
      color: 'var(--text-on-dark)',
      border: '1px solid var(--surface-invert)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: 'var(--border)'
    }
  };
  const style = {
    display: 'inline-block',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-2xs)',
    fontWeight: 'var(--weight-semibold)',
    letterSpacing: 'var(--tracking-wider)',
    textTransform: 'uppercase',
    padding: '3px 10px',
    borderRadius: 'var(--radius)',
    ...variants[variant]
  };
  return React.createElement('span', {
    style
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick
}) {
  const base = {
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-semibold)',
    letterSpacing: 'var(--tracking-wide)',
    border: '2px solid',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all var(--transition-fast)',
    borderRadius: 'var(--radius)',
    opacity: disabled ? 0.5 : 1,
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  };
  const sizes = {
    sm: {
      padding: '7px 18px',
      fontSize: 'var(--text-sm)'
    },
    md: {
      padding: '10px 26px',
      fontSize: 'var(--text-sm)'
    },
    lg: {
      padding: '13px 32px',
      fontSize: 'var(--text-base)'
    }
  };
  const variants = {
    primary: {
      background: 'var(--color-ink-900)',
      color: 'var(--text-on-dark)',
      borderColor: 'var(--color-ink-900)'
    },
    outline: {
      background: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'var(--color-ink-900)'
    },
    'outline-light': {
      background: 'transparent',
      color: 'var(--text-on-dark)',
      borderColor: 'var(--text-on-dark)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-primary)',
      borderColor: 'transparent'
    }
  };
  const style = {
    ...base,
    ...sizes[size],
    ...variants[variant]
  };
  return React.createElement('button', {
    style,
    disabled,
    onClick,
    onMouseEnter: e => {
      if (disabled) return;
      if (variant === 'primary') e.currentTarget.style.background = 'var(--hover-ink)';
      if (variant === 'outline') e.currentTarget.style.background = 'var(--color-ink-100)';
      if (variant === 'outline-light') e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
      if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-secondary)';
    },
    onMouseLeave: e => {
      if (disabled) return;
      if (variant === 'primary') e.currentTarget.style.background = 'var(--color-ink-900)';
      if (variant === 'outline') e.currentTarget.style.background = 'transparent';
      if (variant === 'outline-light') e.currentTarget.style.background = 'transparent';
      if (variant === 'ghost') e.currentTarget.style.color = 'var(--text-primary)';
    }
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function Card({
  children,
  padding = 'md',
  bordered = true,
  subtle = false,
  style: extraStyle
}) {
  const paddings = {
    sm: 'var(--space-6)',
    md: '34px 28px',
    lg: '50px 40px'
  };
  const style = {
    background: subtle ? 'var(--surface-subtle)' : 'var(--surface-page)',
    border: bordered ? 'var(--border)' : 'none',
    borderRadius: 'var(--radius)',
    padding: paddings[padding],
    ...extraStyle
  };
  return React.createElement('div', {
    style
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  disabled = false
}) {
  const wrapStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-1)',
    fontFamily: 'var(--font-body)'
  };
  const labelStyle = {
    fontSize: 'var(--text-sm)',
    fontWeight: 'var(--weight-semibold)',
    color: 'var(--text-primary)',
    letterSpacing: 'var(--tracking-wide)'
  };
  const inputStyle = {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-base)',
    color: 'var(--text-primary)',
    background: disabled ? 'var(--surface-subtle)' : 'var(--surface-page)',
    border: 'var(--border)',
    borderRadius: 'var(--radius)',
    padding: '9px 12px',
    outline: 'none',
    width: '100%',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'border-color var(--transition-fast)'
  };
  return React.createElement('div', {
    style: wrapStyle
  }, label && React.createElement('label', {
    style: labelStyle
  }, label), React.createElement('input', {
    type,
    placeholder,
    value,
    onChange,
    disabled,
    style: inputStyle,
    onFocus: e => {
      e.currentTarget.style.borderColor = 'var(--color-ink-600)';
    },
    onBlur: e => {
      e.currentTarget.style.borderColor = 'var(--color-ink-200)';
    }
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionTitle.jsx
try { (() => {
function SectionTitle({
  children
}) {
  const style = {
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-2xl)',
    fontWeight: 'var(--weight-bold)',
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-9)',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    justifyContent: 'center'
  };
  const ruleStyle = {
    flex: 1,
    maxWidth: '200px',
    height: '1px',
    background: 'var(--border-default)',
    display: 'block'
  };
  return React.createElement('h2', {
    style
  }, React.createElement('span', {
    style: ruleStyle
  }), children, React.createElement('span', {
    style: ruleStyle
  }));
}
Object.assign(__ds_scope, { SectionTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionTitle.jsx", error: String((e && e.message) || e) }); }

// components/core/StatItem.jsx
try { (() => {
function StatItem({
  number,
  suffix = '',
  label
}) {
  const wrapStyle = {
    padding: 'var(--space-5)',
    textAlign: 'center',
    fontFamily: 'var(--font-body)'
  };
  const numStyle = {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 'var(--weight-bold)',
    color: 'var(--text-primary)',
    lineHeight: 'var(--leading-tight)',
    marginBottom: '8px'
  };
  const supStyle = {
    fontSize: '0.5em',
    verticalAlign: 'super'
  };
  const labelStyle = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)'
  };
  return React.createElement('div', {
    style: wrapStyle
  }, React.createElement('div', {
    style: numStyle
  }, number, suffix && React.createElement('sup', {
    style: supStyle
  }, suffix)), React.createElement('div', {
    style: labelStyle
  }, label));
}
Object.assign(__ds_scope, { StatItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatItem.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SectionTitle = __ds_scope.SectionTitle;

__ds_ns.StatItem = __ds_scope.StatItem;

})();
