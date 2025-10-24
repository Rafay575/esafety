import ScrollToTop from "@/components/Base/ScrollToTop";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./stores/store";
import Router from "./router";
import "./assets/css/app.css";
import QueryProvider from "@/lib/query-client";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Provider store={store}>
      <QueryProvider>
        <Toaster position="top-right" richColors  />

        <Router />
      </QueryProvider>
    </Provider>
    <ScrollToTop />
  </BrowserRouter>
);
