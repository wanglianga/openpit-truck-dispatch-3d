import { Scene } from '../scene/Scene';
import { TopToolbar } from '../components/layout/TopToolbar';
import { LeftDashboard } from '../components/layout/LeftDashboard';
import { RightReplayPanel } from '../components/layout/RightReplayPanel';
import { BottomLegend } from '../components/layout/BottomLegend';
import { VehicleDetail } from '../components/vehicle/VehicleDetail';

export default function Home() {
  return (
    <div className="w-screen h-screen relative overflow-hidden bg-mine-bg">
      <Scene />
      <TopToolbar />
      <LeftDashboard />
      <RightReplayPanel />
      <BottomLegend />
      <VehicleDetail />
    </div>
  );
}
