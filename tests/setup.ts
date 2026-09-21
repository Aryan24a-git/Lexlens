// Test setup file — imported by vitest before each test suite
// Set test environment variables before any imports
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "mock-groq-api-key-for-tests";
process.env.NODE_ENV = "test";

// Mock next/navigation for component tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock next/font to avoid font loading in tests
vi.mock("next/font/google", () => ({
  Literata: () => ({ className: "font-display", variable: "--font-display" }),
  Public_Sans: () => ({ className: "font-ui", variable: "--font-ui" }),
}));
