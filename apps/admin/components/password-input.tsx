'use client';
import { useState } from 'react';
import { IconEye, IconEyeOff } from './icons';

/**
 * A password <input> with a show/hide toggle. Used anywhere a password is
 * typed (login, creating a user, changing your own password) so mistyped
 * passwords are actually checkable before submitting.
 */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  id?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="current-password"
        className={className ?? 'w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent outline-none transition-all bg-white'}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full px-3 flex items-center text-gray-400 hover:text-gray-700"
      >
        {visible ? <IconEyeOff size={17} /> : <IconEye size={17} />}
      </button>
    </div>
  );
}
