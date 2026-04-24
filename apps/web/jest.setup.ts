import '@testing-library/jest-dom';
import React from 'react';
import type { ReactNode } from 'react';

jest.mock('next/link', () => {
  return function MockedLink({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  }) {
    return React.createElement('a', { href, ...rest }, children);
  };
});
