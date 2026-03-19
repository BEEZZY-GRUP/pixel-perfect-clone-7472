import AuthGuard from "@/components/hive/AuthGuard";
import CommunityLayout from "@/components/hive/CommunityLayout";

const HiveCommunity = () => {
  return (
    <AuthGuard>
      <CommunityLayout />
    </AuthGuard>
  );
};

export default HiveCommunity;
