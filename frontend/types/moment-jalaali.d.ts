declare module "moment-jalaali" {
  import moment from "moment";

  const m: moment.MomentStatic & {
    (
      date?: moment.MomentInput,
      format?: string,
      lang?: string,
      strict?: boolean,
    ): moment.Moment;
    locale(lang: string): typeof m;
    loadPersian(): typeof m;
  };

  export default m;
}
