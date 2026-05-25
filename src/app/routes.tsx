import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// User Pages
import { LandingPage } from "./pages/LandingPage";
import { ResultsPage } from "./pages/ResultsPage";
// import { AdminLeaderboard } from "./pages/AdminLeaderboard";

// Admin Pages
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CampaignList } from "./pages/admin/Campaignlist";
import { CampaignManagement } from "./pages/admin/CampaignManagement";
import { QuestionBank } from "./pages/admin/QuestionBank";
import { AdminLeaderboard } from "./pages/admin/AdminLeaderboard";

// New QR Quiz flow
import { CampaignQuiz } from "./pages/admin/Campaignquiz";
import { CampaignRegister } from "./pages/admin/Campaignregister";

// Others
import { SessionExpired } from "./pages/SessionExpired";
import { NotFound } from "./pages/NotFound";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { TermsAndConditions } from "./pages/TermsAndConditions";

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      // Default redirect
      { index: true, element: <Navigate to="/campaign/summer2025/register" replace /> },

      // User Routes
      { path: "campaign/:campaignId", element: <LandingPage /> },
      { path: "campaign/:campaignId/register", element: <CampaignRegister /> },  // ← new
      { path: "campaign/:campaignId/quiz", element: <CampaignQuiz /> },          // ← new
      { path: "campaign/:campaignId/results", element: <ResultsPage /> },
      { path: "campaign/:campaignId/leaderboard", element: <AdminLeaderboard /> },
      { path: "/terms", element: <TermsAndConditions /> },
      { path: "/privacy", element: <PrivacyPolicy /> },
      // Session Expired
      { path: "session-expired", element: <SessionExpired /> },

      // === ADMIN ROUTES ===
      { path: "admin/login", element: <AdminLogin /> },
      { path: "admin/dashboard", element: <AdminDashboard /> },
      { path: "admin/campaigns", element: <CampaignList /> },
      { path: "admin/campaigns/new", element: <CampaignManagement /> },
      { path: "admin/campaigns/:campaignId", element: <CampaignManagement /> },
      { path: "admin/campaigns/:campaignId/edit", element: <CampaignManagement /> },
      { path: "admin/questions", element: <QuestionBank /> },
      { path: "admin/leaderboard", element: <AdminLeaderboard /> },

      // 404
      { path: "*", element: <NotFound /> },
    ],
  },
]);