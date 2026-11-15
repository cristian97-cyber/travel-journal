import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Header } from './header';

describe('Header', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should render the current header content', () => {
    const fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const logo = element.querySelector<HTMLImageElement>('.brand__logo');
    expect(logo?.getAttribute('src')).toBe('/travel-journal-logo.png');
    expect(logo?.alt).toBe('Travel Journal');
    expect(element.querySelector('.local-badge')?.textContent).toContain(
      'Dati solo sul dispositivo',
    );
  });
});
