import React from "react";

interface ProfileSidebarProps {
  name?: string;
  avatarUrl?: string;
  allCoursesCount?: number;
  inprogressCount?: number;
  completedCount?: number;
  variant: "desktop" | "mobile";
}

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=random&size=120";

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  name = "User",
  avatarUrl,
  allCoursesCount = 0,
  inprogressCount = 0,
  completedCount = 0,
  variant,
}) => {
  const imgSrc = avatarUrl || DEFAULT_AVATAR;

  if (variant === "desktop") {
    return (
      <aside className="hidden md:flex w-full md:w-1/3 flex-col items-center">
        <div className="bg-white rounded-xl shadow p-6 w-full flex flex-col items-center sticky top-24">
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center">
            <img
              src={imgSrc}
              alt={`${name}'s profile`}
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
          </div>
          <h2 className="mt-4 text-xl text-gray-800">{name}</h2>
          <div className="flex justify-between w-full mt-6 gap-2">
            <StatBox label="All Courses" value={allCoursesCount} />
            <StatBox label="Course Inprogress" value={inprogressCount} />
            <StatBox label="Course Completed" value={completedCount} />
          </div>
        </div>
      </aside>
    );
  }

  // mobile
  return (
    <aside className="w-full flex flex-col items-center md:hidden">
      <div className="bg-white shadow p-4 w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center">
            <img
              src={imgSrc}
              alt={`${name}'s profile`}
              className="w-full h-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
              }}
            />
          </div>
          <span className="text-[17px] font-medium text-[#444]">{name}</span>
        </div>
        <div className="flex gap-3">
          <StatBoxMobile label="All Courses" value={allCoursesCount} />
          <StatBoxMobile label="Course In Progress" value={inprogressCount} />
          <StatBoxMobile label="Course Completed" value={completedCount} />
        </div>
      </div>
    </aside>
  );
};

export default ProfileSidebar;


const StatBox: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col bg-gray-200 gap-4 p-4 rounded-[8px] w-1/3">
    <div className="text-sm text-gray-700">{label}</div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);

const StatBoxMobile: React.FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between bg-gray-100 rounded-lg px-3 py-2 flex-1">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-[16px] font-bold text-gray-700">{value}</span>
  </div>
);
