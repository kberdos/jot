"use client";

import { Coordinate, useCameraStore } from "@/util/objects/camera";
import {
  GhostSection,
  noteIsInSection,
  saveSection,
  Section,
  useSectionStore,
} from "@/util/objects/section";
import { toCamera } from "@/util/pointerfunctions";
import { useEffect, useRef, useState } from "react";
import { saveNote, useNoteStore } from "@/util/objects/note";
import { useArrowStore } from "@/util/objects/arrow";
import { useAuthStore } from "@/util/auth/auth";

const MIN_SECTION_SIZE = 80;

type ResizeCorner = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";

const resizeHandles: { corner: ResizeCorner; className: string }[] = [
  { corner: "TOP_LEFT", className: "-left-2 -top-2 cursor-nwse-resize" },
  { corner: "TOP_RIGHT", className: "-right-2 -top-2 cursor-nesw-resize" },
  {
    corner: "BOTTOM_RIGHT",
    className: "-right-2 -bottom-2 cursor-nwse-resize",
  },
  { corner: "BOTTOM_LEFT", className: "-left-2 -bottom-2 cursor-nesw-resize" },
];

const getTitleWidth = (title: string) => `${Math.max(title.length, 1)}ch`;

const SectionTitle = (props: {
  section: Section;
  onEditingChange: (isEditing: boolean) => void;
  onSelect: () => void;
}) => {
  const updateSection = useSectionStore((state) => state.updateSection);
  const user = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(props.section.title);
  const [titleEditMinWidth, setTitleEditMinWidth] = useState(
    props.section.title.length,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldCommitRef = useRef(true);

  useEffect(() => {
    if (!isEditing) return;

    inputRef.current?.focus();
  }, [isEditing]);

  const startEditing = () => {
    props.onSelect();
    setTitleDraft(props.section.title);
    setTitleEditMinWidth(props.section.title.length);
    shouldCommitRef.current = true;
    setIsEditing(true);
    props.onEditingChange(true);

    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(
        props.section.title.length,
        props.section.title.length,
      );
    });
  };

  const stopEditing = (shouldCommit: boolean) => {
    if (shouldCommit) {
      const title = titleDraft.trim() || "Untitled Section";
      const nextSection = {
        ...props.section,
        title,
        last_modified_by: user!.id,
      };

      setTitleDraft(title);
      updateSection(props.section.id, {
        title,
        last_modified_by: user!.id,
      });
      saveSection(nextSection);
    } else {
      setTitleDraft(props.section.title);
    }

    setIsEditing(false);
    props.onEditingChange(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 24,
        top: 18,
        backgroundColor: "#FFFFFF",
        color: "#000",
        fontFamily: "Roboto, Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "normal",
        fontWeight: 700,
        lineHeight: "normal",
        padding: "4px 10px",
        pointerEvents: "auto",
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        props.onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={titleDraft}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "inherit",
            font: "inherit",
            fontWeight: "inherit",
            width: getTitleWidth(titleDraft),
            minWidth: getTitleWidth(
              props.section.title.slice(0, titleEditMinWidth),
            ),
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={() => {
            if (!shouldCommitRef.current) {
              shouldCommitRef.current = true;
              return;
            }

            stopEditing(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              shouldCommitRef.current = true;
              stopEditing(true);
            }

            if (e.key === "Escape") {
              e.preventDefault();
              shouldCommitRef.current = false;
              stopEditing(false);
            }
          }}
        />
      ) : (
        props.section.title
      )}
    </div>
  );
};

export const SectionComponent = ({ section }: { section: Section }) => {
  const camera = useCameraStore((state) => state.camera);
  const {
    updateSection,
    activeSectionId,
    highlightedSectionIds,
    setActiveSection,
  } = useSectionStore();
  const { updateNote, setActiveNote } = useNoteStore();
  const setActiveArrow = useArrowStore((state) => state.setActiveArrow);
  const user = useAuthStore((state) => state.user);
  const isActive = activeSectionId === section.id;
  const isHighlighted = highlightedSectionIds.includes(section.id);
  const sectionRef = useRef(section);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  const saveSectionAndMembership = async (currentSection: Section) => {
    const currentNotes = useNoteStore.getState().notes;

    const sweptNotes = currentNotes.filter(
      (note) =>
        note.section_id !== currentSection.id &&
        noteIsInSection(note, currentSection),
    );
    const releasedNotes = currentNotes.filter(
      (note) =>
        note.section_id === currentSection.id &&
        !noteIsInSection(note, currentSection),
    );
    sweptNotes.forEach((note) =>
      updateNote(note.id, {
        section_id: currentSection.id,
        last_modified_by: user!.id,
      }),
    );
    releasedNotes.forEach((note) =>
      updateNote(note.id, {
        section_id: null,
        last_modified_by: user!.id,
      }),
    );

    await Promise.all([
      ...currentNotes
        .filter((note) => note.section_id === currentSection.id)
        .map((note) =>
          saveNote({
            ...note,
            section_id: releasedNotes.some((releasedNote) => releasedNote.id === note.id)
              ? null
              : note.section_id,
            last_modified_by: user!.id,
          }),
        ),
      ...sweptNotes.map((note) =>
        saveNote({
          ...note,
          section_id: currentSection.id,
          last_modified_by: user!.id,
        }),
      ),
      saveSection({
        ...currentSection,
        last_modified_by: user!.id,
      }),
    ]);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveNote(null);
    setActiveArrow(null);
    setActiveSection(section.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isEditingTitle) return;
    if (e.buttons !== 1) return;
    const dx = e.movementX / camera.zoom;
    const dy = e.movementY / camera.zoom;
    const currentSection = sectionRef.current;
    const nextSection = {
      ...currentSection,
      x: currentSection.x + dx,
      y: currentSection.y + dy,
      last_modified_by: user!.id,
    };
    sectionRef.current = nextSection;
    updateSection(section.id, {
      x: nextSection.x,
      y: nextSection.y,
      last_modified_by: user!.id,
    });
    useNoteStore
      .getState()
      .notes.filter((note) => note.section_id === section.id)
      .forEach((note) =>
        updateNote(note.id, {
          x: note.x + dx,
          y: note.y + dy,
          last_modified_by: user!.id,
        }),
      );
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    await saveSectionAndMembership(sectionRef.current);
  };

  const resizeSection = (corner: ResizeCorner, dx: number, dy: number) => {
    const currentSection = sectionRef.current;
    let { x, y, width, height } = currentSection;

    if (corner === "TOP_LEFT" || corner === "BOTTOM_LEFT") {
      x += dx;
      width -= dx;

      if (width < MIN_SECTION_SIZE) {
        x = currentSection.x + currentSection.width - MIN_SECTION_SIZE;
        width = MIN_SECTION_SIZE;
      }
    }

    if (corner === "TOP_RIGHT" || corner === "BOTTOM_RIGHT") {
      width = Math.max(MIN_SECTION_SIZE, width + dx);
    }

    if (corner === "TOP_LEFT" || corner === "TOP_RIGHT") {
      y += dy;
      height -= dy;

      if (height < MIN_SECTION_SIZE) {
        y = currentSection.y + currentSection.height - MIN_SECTION_SIZE;
        height = MIN_SECTION_SIZE;
      }
    }

    if (corner === "BOTTOM_LEFT" || corner === "BOTTOM_RIGHT") {
      height = Math.max(MIN_SECTION_SIZE, height + dy);
    }

    const nextSection = {
      ...currentSection,
      x,
      y,
      width,
      height,
      last_modified_by: user!.id,
    };
    sectionRef.current = nextSection;
    updateSection(section.id, {
      x,
      y,
      width,
      height,
      last_modified_by: user!.id,
    });
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveNote(null);
    setActiveArrow(null);
    setActiveSection(section.id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (
    e: React.PointerEvent,
    corner: ResizeCorner,
  ) => {
    e.stopPropagation();
    if (e.buttons !== 1) return;

    resizeSection(corner, e.movementX / camera.zoom, e.movementY / camera.zoom);
  };

  const handleResizePointerUp = async (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    await saveSectionAndMembership(sectionRef.current);
  };

  const selectSection = () => {
    setActiveNote(null);
    setActiveArrow(null);
    setActiveSection(section.id);
  };

  return (
    <div
      style={{
        position: "absolute",
        left: section.x,
        top: section.y,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        style={{
          backgroundColor: section.color,
          border: isActive
            ? "3px solid var(--blue)"
            : isHighlighted
              ? "3px solid #000"
              : "3px solid transparent",
          width: `${section.width}px`,
          height: `${section.height}px`,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <SectionTitle
          section={section}
          onEditingChange={setIsEditingTitle}
          onSelect={selectSection}
        />
        {isActive &&
          resizeHandles.map(({ corner, className }) => (
            <button
              key={corner}
              aria-label={`Resize section ${corner.toLowerCase().replace("_", " ")}`}
              className={`absolute z-[501] h-4 w-4 rounded-[4px] border-2 border-[var(--blue)] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] ${className}`}
              onPointerDown={handleResizePointerDown}
              onPointerMove={(e) => handleResizePointerMove(e, corner)}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
            />
          ))}
      </div>
    </div>
  );
};

export const GhostSectionComponent = (props: {
  ghostSection: GhostSection;
}) => {
  const { camera } = useCameraStore();
  const [end, setEnd] = useState<Coordinate>({
    x: props.ghostSection.start_x,
    y: props.ghostSection.start_y,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setEnd(toCamera(e, camera));
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: Math.min(props.ghostSection.start_x, end.x),
        top: Math.min(props.ghostSection.start_y, end.y),
        width: Math.abs(end.x - props.ghostSection.start_x),
        height: Math.abs(end.y - props.ghostSection.start_y),
        border: "2px dashed #888",
        pointerEvents: "none",
      }}
    />
  );
};
