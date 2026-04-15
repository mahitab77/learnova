import ParentDashboardPage from "../src/app/parent/dashboard/page";
import ParentChildrenPage from "../src/app/parent/dashboard/children/page";
import ParentRequestsPage from "../src/app/parent/dashboard/requests/page";
import ParentMessagesPage from "../src/app/parent/dashboard/messages/page";
import TeacherDashboardPage from "../src/app/teacher/dashboard/page";

type RouteModule = {
  default: (...args: unknown[]) => unknown;
};

const parentDashboardRoute: RouteModule = { default: ParentDashboardPage };
const parentChildrenRoute: RouteModule = { default: ParentChildrenPage };
const parentRequestsRoute: RouteModule = { default: ParentRequestsPage };
const parentMessagesRoute: RouteModule = { default: ParentMessagesPage };
const teacherDashboardRoute: RouteModule = { default: TeacherDashboardPage };

export {
  parentDashboardRoute,
  parentChildrenRoute,
  parentRequestsRoute,
  parentMessagesRoute,
  teacherDashboardRoute,
};
