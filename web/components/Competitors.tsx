"use client";
import { useI18n } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Reveal from "./Reveal";

const KEYS = [
  "opgg", "ugg", "blitz", "mobalytics", "porofessor",
  "vlr", "thespike", "leetify", "faceit", "log",
] as const;

export default function Competitors() {
  const { t } = useI18n();
  return (
    <Reveal className="section reveal" id="competitors">
      <div className="container">
        <div className="sec-head">
          <div>
            <p className="eyebrow"><span className="dot" /> {t("competitors.eyebrow")}</p>
            <h2 className="h2" style={{ marginTop: 12 }}>{t("competitors.title")}</h2>
          </div>
          <p className="meta text-mute">{t("competitors.lead")}</p>
        </div>

        <div className="competitors-wrap">
          <Table>
            <TableHeader>
              <TableRow className="comp-head">
                <TableHead className="comp-th">{t("competitors.col_product")}</TableHead>
                <TableHead className="comp-th">{t("competitors.col_scope")}</TableHead>
                <TableHead className="comp-th">{t("competitors.col_issue")}</TableHead>
                <TableHead className="comp-th">{t("competitors.col_answer")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KEYS.map((k) => (
                <TableRow key={k} className="comp-row">
                  <TableCell className="comp-cell comp-name mono">{t(`competitors.${k}.name`)}</TableCell>
                  <TableCell className="comp-cell"><span className={`comp-tag tag-${t(`competitors.${k}.scope_kind`)}`}>{t(`competitors.${k}.scope`)}</span></TableCell>
                  <TableCell className="comp-cell text-mute">{t(`competitors.${k}.issue`)}</TableCell>
                  <TableCell className="comp-cell comp-answer">{t(`competitors.${k}.answer`)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="meta text-faint" style={{ marginTop: 24, maxWidth: "70ch" }}>
          {t("competitors.disclaimer")}
        </p>
      </div>
    </Reveal>
  );
}
