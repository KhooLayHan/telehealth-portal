import { useGetPublicSystemSettings } from "@/api/generated/system-settings/system-settings";

const DEFAULT_SYSTEM_NAME = "TeleHealth";
const SYSTEM_NAME_STALE_TIME_MS = 5 * 60 * 1000;

// Reads the public system name and falls back while the request is loading or unavailable.
export function useSystemName() {
  const systemSettingsQuery = useGetPublicSystemSettings({
    query: {
      staleTime: SYSTEM_NAME_STALE_TIME_MS,
    },
  });

  const systemName =
    systemSettingsQuery.data?.status === 200
      ? systemSettingsQuery.data.data.systemName
      : DEFAULT_SYSTEM_NAME;

  return {
    systemName,
    isLoading: systemSettingsQuery.isLoading,
  };
}
