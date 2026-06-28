import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, dirPath, filePath, folderName, linkName, linkUrl } = body;

    if (action === "list") {
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          return NextResponse.json({ error: "Not a directory" }, { status: 400 });
        }
        
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const result = items.map(item => ({
          name: item.name,
          isDirectory: item.isDirectory(),
          path: path.join(dirPath, item.name)
        })).sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        
        return NextResponse.json({ items: result });
      } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
      }
    }

    if (action === "read") {
      try {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.pdf') {
          const content = await fs.readFile(filePath);
          const base64 = content.toString('base64');
          return NextResponse.json({ type: 'pdf', content: `data:application/pdf;base64,${base64}` });
        } else if (ext === '.link') {
          const content = await fs.readFile(filePath, "utf-8");
          return NextResponse.json({ type: 'link', content });
        } else {
          const content = await fs.readFile(filePath, "utf-8");
          return NextResponse.json({ type: 'text', content });
        }
      } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
      }
    }

    if (action === "createFolder") {
      try {
        const targetPath = path.join(dirPath, folderName);
        await fs.mkdir(targetPath, { recursive: true });
        return NextResponse.json({ success: true, path: targetPath });
      } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
      }
    }

    if (action === "createLink") {
      try {
        const targetPath = path.join(dirPath, `${linkName}.link`);
        await fs.writeFile(targetPath, linkUrl, "utf-8");
        return NextResponse.json({ success: true, path: targetPath });
      } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
