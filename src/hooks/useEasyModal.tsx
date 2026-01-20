import { useState } from "react";

export const useEasyModal = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const showModal = () => {
		setIsModalOpen(true);
		return Promise.resolve();
	};

	const closeModal = () => {
		setIsModalOpen(false);
	};

	const handleOk = () => {
		setIsModalOpen(false);
	};

	const handleCancel = () => {
		setIsModalOpen(false);
	};
	return {
		isModalOpen,
		showModal,
		closeModal,
	};
};
