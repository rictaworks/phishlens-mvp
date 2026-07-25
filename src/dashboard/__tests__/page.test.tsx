import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('見出しを表示する', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: 'PhishLens ダッシュボード' })).toBeInTheDocument();
  });
});
