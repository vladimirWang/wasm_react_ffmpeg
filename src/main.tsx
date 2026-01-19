import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ModalComponent } from "./components/GlobalModal.tsx";
// import { mock, result } from './mazeUtils/1.ts'

// console.log('isconnected: ', mock, result);
ReactDOM.createRoot(document.getElementById("root")!).render(
	<>
		<App />
		<ModalComponent />
	</>
);
