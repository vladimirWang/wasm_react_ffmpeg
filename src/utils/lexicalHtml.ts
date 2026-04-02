import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";

type LexicalHtmlOptions = {
	/** 若传入的是纯文本/空串，是否仍包一层 <p> */
	wrapParagraph?: boolean;
};

const DEFAULT_OPTIONS: Required<LexicalHtmlOptions> = {
	wrapParagraph: true,
};

/** 将 Product 的 `desc`（Lexical JSON / HTML / 纯文本）统一转成 HTML 字符串 */
export async function lexicalDescToHtml(
	desc: string | undefined | null,
	options?: LexicalHtmlOptions
): Promise<string> {
	const opt = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
	const raw = (desc ?? "").trim();
	if (!raw) return opt.wrapParagraph ? "<p></p>" : "";

	// 已是 HTML（简单判断）：直接返回
	if (raw.startsWith("<") && raw.endsWith(">")) {
		return raw;
	}

	const editor = createHeadlessEditor({
		namespace: "product-desc-headless",
		nodes: [ListNode, ListItemNode, LinkNode, AutoLinkNode, CodeNode, CodeHighlightNode],
		onError(error) {
			throw error;
		},
	});

	// 1) 若是 Lexical JSON，解析为 editorState
	if (raw.startsWith("{") && raw.endsWith("}")) {
		try {
			editor.setEditorState(editor.parseEditorState(raw));
			let html = "";
			editor.getEditorState().read(() => {
				html = $generateHtmlFromNodes(editor);
			});
			return html;
		} catch {
			// fallback 走纯文本
		}
	}

	// 2) 纯文本：写入 root 再转 HTML
	editor.update(() => {
		const root = $getRoot();
		root.clear();
		const p = $createParagraphNode();
		p.append($createTextNode(raw));
		root.append(p);
	});
	let html = "";
	editor.getEditorState().read(() => {
		html = $generateHtmlFromNodes(editor);
	});
	return html;
}

/** 将 HTML 转成 Lexical editorState JSON（用于编辑器初始化） */
export function htmlToLexicalJson(html: string): string {
	const raw = (html ?? "").trim();
	const editor = createHeadlessEditor({
		namespace: "product-desc-html-import",
		nodes: [ListNode, ListItemNode, LinkNode, AutoLinkNode, CodeNode, CodeHighlightNode],
		onError(error) {
			throw error;
		},
	});

	editor.update(() => {
		const parser = new DOMParser();
		const dom = parser.parseFromString(raw || "<p></p>", "text/html");
		const nodes = $generateNodesFromDOM(editor, dom);
		const root = $getRoot();
		root.clear();
		root.append(...nodes);
	});

	return JSON.stringify(editor.getEditorState().toJSON());
}

