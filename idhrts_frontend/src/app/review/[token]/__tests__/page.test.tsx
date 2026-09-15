import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewPage from "../page";
import { api } from "@/lib/api";

jest.mock("next/navigation", () => ({
  useParams: () => ({ token: "mock-token-123" }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe("ReviewPage Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state initially and renders contract details on success", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        contract_reg_number: "CONT-123",
        monthly_rent_etb: 5000,
        lease_duration_months: 12,
        status: "PENDING_TENANT_SIGNATURE",
      },
    });

    render(<ReviewPage />);
    
    expect(screen.getByText(/Loading contract.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("CONT-123: Rental Contract Review")).toBeInTheDocument();
    });
    
    expect(screen.getByText("ETB 5,000")).toBeInTheDocument();
  });

  it("shows error state when API fails to fetch contract", async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    render(<ReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByText("Invalid Contract Link")).toBeInTheDocument();
    });
    expect(screen.getByText("This contract link is invalid or has expired.")).toBeInTheDocument();
  });

  it("handles OTP modal logic correctly (request, type, verify)", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        monthly_rent_etb: 5000,
        lease_duration_months: 12,
        status: "PENDING_TENANT_SIGNATURE",
      },
    });

    render(<ReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByText("I have read and understood all contract terms")).toBeInTheDocument();
    });

    // Checkbox must be clicked to enable the button
    const agreeCheckbox = screen.getByRole("checkbox");
    fireEvent.click(agreeCheckbox);

    // Click 'I Agree & Sign Digitally'
    const signButton = screen.getByRole("button", { name: "I Agree & Sign Digitally" });
    
    // Mock OTP request success
    (api.post as jest.Mock).mockResolvedValueOnce({});
    fireEvent.click(signButton);

    // Wait for OTP modal
    await waitFor(() => {
      expect(screen.getByText("Enter OTP")).toBeInTheDocument();
    });

    const otpInput = screen.getByPlaceholderText("••••••");
    fireEvent.change(otpInput, { target: { value: "123456" } });

    const verifyButton = screen.getByRole("button", { name: "Verify & Sign" });
    
    // Mock Verify success
    (api.post as jest.Mock).mockResolvedValueOnce({});
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("Contract Signed Successfully")).toBeInTheDocument();
    });
  });

  it("shows error inside OTP modal when API verify fails", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        monthly_rent_etb: 5000,
        lease_duration_months: 12,
        status: "PENDING_TENANT_SIGNATURE",
      },
    });
    (api.post as jest.Mock).mockResolvedValueOnce({}); // Request OTP success
    (api.post as jest.Mock).mockRejectedValueOnce(new Error("OTP Error")); // Verify OTP fail

    render(<ReviewPage />);
    
    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "I Agree & Sign Digitally" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("••••••")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("••••••"), { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify & Sign" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired OTP.")).toBeInTheDocument();
    });
  });

  it("handles request OTP failure", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        monthly_rent_etb: 5000,
        lease_duration_months: 12,
        status: "PENDING_TENANT_SIGNATURE",
      },
    });
    (api.post as jest.Mock).mockRejectedValueOnce(new Error("OTP Request Fail"));

    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "I Agree & Sign Digitally" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to request OTP.")).toBeInTheDocument();
    });
  });

  it("handles OTP modal cancel button", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        monthly_rent_etb: 5000,
        lease_duration_months: 12,
        status: "PENDING_TENANT_SIGNATURE",
      },
    });
    (api.post as jest.Mock).mockResolvedValueOnce({});

    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "I Agree & Sign Digitally" }));

    await waitFor(() => expect(screen.getByText("Enter OTP")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Enter OTP")).not.toBeInTheDocument();
  });

  it("renders already signed status when status is SIGNED or REGISTERED", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        monthly_rent_etb: 5000,
        lease_duration_months: 12,
        status: "SIGNED",
        start_date: "2023-01-01",
        end_date: "2024-01-01",
        property: { house_number: "101", building_type: "VILLA" },
        landlord: { full_name_en: "Landlord Joe" },
      },
    });

    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByText("Contract Already Signed")).toBeInTheDocument());
    expect(screen.getByText("House #101, VILLA")).toBeInTheDocument();
    expect(screen.getAllByText("Landlord Joe").length).toBe(2);
  });

  // --- Missing branch coverage tests ---

  it("requestOtp is a no-op when agreed is false (guard branch)", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { monthly_rent_etb: 3000, lease_duration_months: 12, status: "PENDING_TENANT_SIGNATURE" },
    });

    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeInTheDocument());

    // Do NOT click the checkbox — agreed stays false
    // Click Sign button directly; it is disabled so nothing should happen
    const signButton = screen.getByRole("button", { name: "I Agree & Sign Digitally" });
    expect(signButton).toBeDisabled();
    // api.post must never have been called
    expect(api.post).not.toHaveBeenCalled();
  });

  it("verifyAndSign shows validation error when OTP is less than 6 digits", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { monthly_rent_etb: 3000, lease_duration_months: 12, status: "PENDING_TENANT_SIGNATURE" },
    });
    (api.post as jest.Mock).mockResolvedValueOnce({}); // OTP request success

    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "I Agree & Sign Digitally" }));

    await waitFor(() => expect(screen.getByPlaceholderText("••••••")).toBeInTheDocument());

    // Enter only 4 digits — should NOT hit the API
    fireEvent.change(screen.getByPlaceholderText("••••••"), { target: { value: "1234" } });

    // Verify button should remain disabled (otp.length !== 6)
    const verifyButton = screen.getByRole("button", { name: "Verify & Sign" });
    expect(verifyButton).toBeDisabled();
    // Only the OTP-request post was called — sign post must not have been called
    expect(api.post).toHaveBeenCalledTimes(1);
  });

  it("renders advance_payment_etb when provided (non-null branch)", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        monthly_rent_etb: 5000,
        advance_payment_etb: 10000,
        lease_duration_months: 24,
        status: "PENDING_TENANT_SIGNATURE",
      },
    });

    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByText("ETB 10,000")).toBeInTheDocument());
  });

  it("renders dash fallbacks when property and landlord are null", async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        monthly_rent_etb: 2000,
        lease_duration_months: 12,
        status: "PENDING_TENANT_SIGNATURE",
        property: null,
        landlord: null,
      },
    });

    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByText("Contract Terms")).toBeInTheDocument());
    // Both property and landlord cells should show "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
