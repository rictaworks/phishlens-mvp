import { render, screen } from '@testing-library/react';
import { KpiTile } from '../../app/components/KpiTile';

describe('KpiTile', () => {
  it('ラベルと値を表示する', () => {
    render(<KpiTile label="判定実行数" value="128" />);

    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('判定実行数')).toBeInTheDocument();
  });
});
