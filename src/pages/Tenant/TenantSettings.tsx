import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Spin, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import ImageUpload from "../../components/ImageUpload";
import { getTenantProfile, updateTenant, type ITenant } from "../../api/tenant";

interface TenantFormValues {
	name: string;
	logo?: string[];
}

/**
 * 租户设置页：编辑租户名称、上传租户 logo
 * 仅租户超级管理员可访问（路由 meta.superUserOnly + loader 拦截 + 后端接口鉴权）
 */
const TenantSettings: React.FC = () => {
	const [form] = Form.useForm<TenantFormValues>();
	const [tenant, setTenant] = useState<ITenant | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const data = await getTenantProfile();
				if (!cancelled) setTenant(data);
			} catch {
				if (!cancelled) message.error("租户信息加载失败");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleSubmit = async (values: TenantFormValues) => {
		setSaving(true);
		try {
			const updated = await updateTenant({
				name: values.name.trim(),
				logo: values.logo && values.logo.length > 0 ? values.logo[0] : null,
			});
			// 同步最新数据（logo 回显地址可能变化）
			setTenant(updated);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card title="租户设置" style={{ maxWidth: 640 }}>
			{loading || !tenant ? (
				<div style={{ textAlign: "center", padding: "48px 0" }}>
					<Spin tip="加载中..." />
				</div>
			) : (
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
					autoComplete="off"
					initialValues={{
						name: tenant.name,
						logo: tenant.logo ? [tenant.logo] : [],
					}}
				>
					<Form.Item
						label="租户名称"
						name="name"
						rules={[
							{ required: true, message: "请输入租户名称" },
							{ max: 50, message: "租户名称最长 50 个字符" },
						]}
					>
						<Input placeholder="请输入租户名称" allowClear />
					</Form.Item>

					<Form.Item
						label="租户 Logo"
						name="logo"
						extra="建议上传正方形图片，支持 JPG / PNG / WEBP，大小不超过 20MB"
					>
						<ImageUpload maxCount={1} />
					</Form.Item>

					<Form.Item style={{ marginBottom: 0 }}>
						<Button
							type="primary"
							htmlType="submit"
							icon={<SaveOutlined />}
							loading={saving}
						>
							保存
						</Button>
					</Form.Item>
				</Form>
			)}
		</Card>
	);
};

export default TenantSettings;
