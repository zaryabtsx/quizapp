import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { RegistrationPage } from "./pages/RegistrationPage";
import { QuizPage } from "./pages/QuizPage";
import { ResultsPage } from "./pages/ResultsPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CampaignManagement } from "./pages/admin/CampaignManagement";
import { QuestionBank } from "./pages/admin/QuestionBank";
import { AdminLeaderboard } from "./pages/admin/AdminLeaderboard";
import { SessionExpired } from "./pages/SessionExpired";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, Component: LandingPage },
      { path: "campaign/:campaignId", Component: LandingPage },
      { path: "campaign/:campaignId/register", Component: RegistrationPage },
      { path: "campaign/:campaignId/quiz", Component: QuizPage },
      { path: "campaign/:campaignId/results", Component: ResultsPage },
      { path: "campaign/:campaignId/leaderboard", Component: LeaderboardPage },
      { path: "session-expired", Component: SessionExpired },
      { path: "admin/login", Component: AdminLogin },
      { path: "admin/dashboard", Component: AdminDashboard },
      { path: "admin/campaigns", Component: CampaignManagement },
      { path: "admin/campaigns/:campaignId/edit", Component: CampaignManagement },
      { path: "admin/questions", Component: QuestionBank },
      { path: "admin/leaderboard", Component: AdminLeaderboard },
      { path: "*", Component: NotFound },
    ],
  },
]);
