import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import WoredaDashboard from "../page";
import { api } from "@/lib/api";

// Mock next router
const mockRouter = { push: jest.fn() };
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// Mock API
jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock recharts
jest.mock("recharts", () => {
  const OriginalRecharts = jest.requireActual("recharts");
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => {
      const React = require("react");
      return React.cloneElement(children, { width: 800, height: 800 });
    }
  };
});

describe("WoredaDashboard Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultMockApi = () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("properties")) {
        return Promise.resolve({
          data: [
            {
              id: "prop-1",
              house_number: "H123",
              building_type: "Villa",
              monthly_rent_etb: 10000,
              status: "PENDING_REVIEW",
              submitted_at: "2023-05-10",
              landlord_detail: { full_name_en: "John Doe", phone_number: "0911223344" },
              woreda: "Woreda 03"
            },
            {
              id: "prop-2",
              house_number: "H456",
              building_type: "Apartment",
              monthly_rent_etb: 8000,
              status: "ACTIVE",
              landlord_detail: { phone_number: "0922334455" }
            },
            {
              id: "prop-3",
              house_number: "H789",
              building_type: "Commercial",
              monthly_rent_etb: 15000,
              status: "REJECTED",
            }
          ]
        });
      }
      if (url.includes("contracts")) {
        return Promise.resolve({
          data: [
            {
              id: "cnt-1",
              contract_reg_number: "REG-001",
              monthly_rent_etb: 12000,
              status: "SIGNED",
              landlord_detail: { full_name_en: "Landlord Jack" },
              tenant_detail: { full_name_en: "Tenant Jill" },
              property_detail: { house_number: "105" }
            },
            {
              id: "cnt-2",
              monthly_rent_etb: 6000,
              status: "REGISTERED",
            }
          ]
        });
      }
      if (url.includes("disputes")) {
        return Promise.resolve({
          data: [
            {
              id: "dsp-1",
              description: "Noise complaint between tenant and neighbor",
              status: "OPEN",
              filed_at: "2023-07-15",
              filer_detail: { full_name_en: "Alice Wonder" }
            }
          ]
        });
      }
      return Promise.resolve({ data: [] });
    });
  };

  it("shows loading state initially and renders Recharts on successful data fetch", async () => {
    defaultMockApi();
    render(<WoredaDashboard />);

    expect(screen.getByText("Loading properties...")).toBeInTheDocument();

    await screen.findByText("#H123");
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dec")).toBeInTheDocument();
  });

  it("triggers error behavior/redirects on API failures during initialization", async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error("Network Error"));
    render(<WoredaDashboard />);
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith("/login"));
  });

  it("filters properties by status and renders empty state if none match", async () => {
    defaultMockApi();
    render(<WoredaDashboard />);
    await screen.findByText("#H123");

    // Filter Active
    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(screen.getByText("#H456")).toBeInTheDocument();
    expect(screen.queryByText("#H123")).not.toBeInTheDocument();

    // Filter Rejected
    fireEvent.click(screen.getByRole("button", { name: "Rejected" }));
    expect(screen.getByText("#H789")).toBeInTheDocument();

    // Filter All
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("#H123")).toBeInTheDocument();
  });

  it("approves a property successfully", async () => {
    defaultMockApi();
    (api.post as jest.Mock).mockResolvedValue({ data: {} });

    render(<WoredaDashboard />);
    await screen.findByText("#H123");

    const approveButton = screen.getByRole("button", { name: "Approve" });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/properties/prop-1/approve/");
      expect(screen.getByText("Property approved successfully.")).toBeInTheDocument();
    });
  });

  it("handles approve property failure", async () => {
    defaultMockApi();
    (api.post as jest.Mock).mockRejectedValue(new Error("Fail"));

    render(<WoredaDashboard />);
    await screen.findByText("#H123");

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to approve property.")).toBeInTheDocument();
    });
  });

  it("rejects a property with reason and handles cancel", async () => {
    defaultMockApi();
    (api.post as jest.Mock).mockResolvedValue({ data: {} });

    render(<WoredaDashboard />);
    await screen.findByText("#H123");

    // Open reject modal
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(screen.getByRole("heading", { name: "Reject" })).toBeInTheDocument();

    // Close via modal backdrop
    const backdrop = document.querySelector(".bg-black\\/40");
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.queryByPlaceholderText("Enter rejection reason")).not.toBeInTheDocument();

    // Open reject modal again
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    // Cancel rejection via cancel button
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByPlaceholderText("Enter rejection reason")).not.toBeInTheDocument();

    // Open reject modal again and submit
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    const textarea = screen.getByPlaceholderText("Enter rejection reason");
    fireEvent.change(textarea, { target: { value: "Rejection reason that is sufficiently long" } });

    fireEvent.click(screen.getByRole("button", { name: "Submit Rejection" }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/properties/prop-1/reject/", {
        reason: "Rejection reason that is sufficiently long"
      });
      expect(screen.getByText("Property rejected.")).toBeInTheDocument();
    });
  });

  it("handles reject property failure", async () => {
    defaultMockApi();
    (api.post as jest.Mock).mockRejectedValue(new Error("Reject fail"));

    render(<WoredaDashboard />);
    await screen.findByText("#H123");

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    const textarea = screen.getByPlaceholderText("Enter rejection reason");
    fireEvent.change(textarea, { target: { value: "Rejection reason that is sufficiently long" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Rejection" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to reject property.")).toBeInTheDocument();
    });
  });

  it("authenticates contract successfully", async () => {
    defaultMockApi();
    (api.post as jest.Mock).mockResolvedValue({ data: {} });

    render(<WoredaDashboard />);
    await waitFor(() => expect(screen.queryByText("Loading properties...")).not.toBeInTheDocument());

    // Switch section to contracts
    fireEvent.click(screen.getByRole("button", { name: /contract authentication/i }));

    expect(screen.getByText("Contracts Awaiting Authentication")).toBeInTheDocument();
    expect(screen.getByText("Landlord Jack")).toBeInTheDocument();
    expect(screen.getByText("Tenant Jill")).toBeInTheDocument();

    const authButton = screen.getByRole("button", { name: "Authenticate" });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/contracts/cnt-1/authenticate/");
      expect(screen.getByText("Contract authenticated successfully.")).toBeInTheDocument();
    });
  });

  it("handles authenticate contract failure", async () => {
    defaultMockApi();
    (api.post as jest.Mock).mockRejectedValue(new Error("Auth fail"));

    render(<WoredaDashboard />);
    await waitFor(() => expect(screen.queryByText("Loading properties...")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /contract authentication/i }));
    const authButton = screen.getByRole("button", { name: "Authenticate" });
    fireEvent.click(authButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to authenticate contract.")).toBeInTheDocument();
    });
  });

  it("switches to Disputes section and renders disputes table", async () => {
    defaultMockApi();
    render(<WoredaDashboard />);
    await waitFor(() => expect(screen.queryByText("Loading properties...")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /disputes/i }));

    expect(screen.getByText("Woreda Disputes")).toBeInTheDocument();
    expect(screen.getByText("Alice Wonder")).toBeInTheDocument();
    expect(screen.getByText("Noise complaint between tenant and neighbor")).toBeInTheDocument();
  });

  it("renders empty states for properties, contracts, and disputes", async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });

    render(<WoredaDashboard />);
    await waitFor(() => expect(screen.queryByText("Loading properties...")).not.toBeInTheDocument());

    expect(screen.getByText("No Properties")).toBeInTheDocument();

    // Contracts empty state
    fireEvent.click(screen.getByRole("button", { name: /contract authentication/i }));
    expect(screen.getByText("No Contracts")).toBeInTheDocument();

    // Disputes empty state
    fireEvent.click(screen.getByRole("button", { name: /disputes/i }));
    expect(screen.getByText("No Disputes")).toBeInTheDocument();
  });
});

