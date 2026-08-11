import { deleteAccount } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/analytics", () => ({
  logEvent: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe("deleteAccount", () => {
  it("calls the delete-account edge function before signing the user out", async () => {
    const getUser = supabase.auth.getUser as jest.Mock;
    const invoke = supabase.functions.invoke as jest.Mock;
    const signOut = supabase.auth.signOut as jest.Mock;

    getUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    invoke.mockResolvedValue({ error: null });
    signOut.mockResolvedValue({ error: null });

    await deleteAccount();

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith("delete-account");
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
