import { useEffect, useRef } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";

interface Node {
  id: string;
  slug: string;
  title: string;
  category: string;
  backlinkCount: number;
}

interface Edge {
  source: string;
  target: string;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
}

export default function KnowledgeGraph({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    svg.innerHTML = "";

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    const zoomGroup = g;

    const simNodes = nodes.map((n) => ({ ...n, x: width / 2 + (Math.random() - 0.5) * 100, y: height / 2 + (Math.random() - 0.5) * 100 }));
    const simEdges = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const simulation = forceSimulation(simNodes as any)
      .force(
        "link",
        forceLink(simEdges)
          .id((d: any) => d.id)
          .distance(120)
      )
      .force("charge", forceManyBody().strength(-300))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide(30));

    const linkElements: SVGLineElement[] = [];
    const nodeElements: SVGGElement[] = [];
    const labelElements: SVGTextElement[] = [];

    // Draw edges
    for (const _edge of simEdges) {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("stroke", "var(--border)");
      line.setAttribute("stroke-width", "1");
      line.setAttribute("stroke-opacity", "0.6");
      g.appendChild(line);
      linkElements.push(line);
    }

    // Draw nodes
    for (const node of simNodes) {
      const group = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );
      group.style.cursor = "pointer";

      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      const r = Math.min(6 + node.backlinkCount * 3, 24);
      circle.setAttribute("r", String(r));
      circle.setAttribute("fill", "var(--accent)");
      circle.setAttribute("fill-opacity", "0.7");
      circle.setAttribute("stroke", "var(--accent)");
      circle.setAttribute("stroke-width", "1.5");
      group.appendChild(circle);

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dy", String(r + 14));
      text.setAttribute("font-size", "11");
      text.setAttribute("fill", "var(--text-secondary)");
      text.setAttribute("font-family", "var(--font-sans)");
      text.textContent = node.title.length > 8 ? node.title.slice(0, 7) + "..." : node.title;
      group.appendChild(text);

      group.addEventListener("click", () => {
        window.location.href = `${import.meta.env.BASE_URL}/articles/${node.slug}`;
      });

      g.appendChild(group);
      nodeElements.push(group);
      labelElements.push(text);
    }

    simulation.on("tick", () => {
      for (let i = 0; i < simEdges.length; i++) {
        const edge = simEdges[i] as any;
        linkElements[i].setAttribute("x1", String(edge.source.x));
        linkElements[i].setAttribute("y1", String(edge.source.y));
        linkElements[i].setAttribute("x2", String(edge.target.x));
        linkElements[i].setAttribute("y2", String(edge.target.y));
      }

      for (let i = 0; i < simNodes.length; i++) {
        const node = simNodes[i] as any;
        nodeElements[i].setAttribute(
          "transform",
          `translate(${node.x}, ${node.y})`
        );
      }
    });

    // Zoom behavior
    let zoomTransform = { x: 0, y: 0, k: 1 };
    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomTransform.k *= delta;
      zoomTransform.k = Math.max(0.3, Math.min(3, zoomTransform.k));
      zoomGroup.setAttribute(
        "transform",
        `translate(${zoomTransform.x}, ${zoomTransform.y}) scale(${zoomTransform.k})`
      );
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  if (nodes.length === 0) {
    return (
      <div className="empty-state">
        <p>暂无文章数据，无法生成知识图谱</p>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
