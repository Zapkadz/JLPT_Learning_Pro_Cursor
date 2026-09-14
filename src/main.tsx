import {
  GrammarCourse,
  GrammarLesson,
  GrammarPattern,
  GrammarExercises,
} from "./features/grammar/Grammar";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";
import { AuthProvider, Layout } from "./App";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { DeckList, DeckDetail } from "./pages/Decks";
import { DeckEditor } from "./pages/DeckEditor";
import { Review } from "./pages/Review";
import { Kana } from "./pages/Kana";
import { Practice } from "./pages/Practice";
import { Progress, SettingsPage } from "./pages/Progress";
import "./styles.css";
const router = createBrowserRouter([
  { path: "/login", element: <Auth /> },
  {
    element: <Layout />,
    errorElement: (
      <div className="empty">
        <h1>Không thể mở trang này</h1>
        <p>Vui lòng tải lại hoặc quay về trang tổng quan.</p>
        <a href="/">Về tổng quan</a>
      </div>
    ),
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/decks", element: <DeckList /> },
      { path: "/decks/new", element: <DeckEditor /> },
      { path: "/decks/:id/edit", element: <DeckEditor /> },
      { path: "/decks/:id", element: <DeckDetail /> },
      { path: "/review", element: <Review /> },
      { path: "/grammar", element: <GrammarCourse /> },
      { path: "/grammar/n2", element: <GrammarCourse /> },
      { path: "/grammar/n2/lessons/:lessonId", element: <GrammarLesson /> },
      { path: "/grammar/n2/patterns/:patternId", element: <GrammarPattern /> },
      {
        path: "/grammar/n2/patterns/:patternId/exercises",
        element: <GrammarExercises />,
      },
      { path: "/kana", element: <Kana /> },
      { path: "/practice", element: <Practice /> },
      { path: "/progress", element: <Progress /> },
      { path: "/settings", element: <SettingsPage /> },
      {
        path: "*",
        element: (
          <div className="empty">
            <h1>Không tìm thấy trang</h1>
            <Link to="/">Về tổng quan</Link>
          </div>
        ),
      },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);
