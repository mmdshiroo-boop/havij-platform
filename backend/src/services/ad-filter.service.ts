// backend/src/services/ad-filter.service.ts

export interface AdFilterOptions {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  priceType?: "fixed" | "negotiable" | "auction";
  adType?: "sale" | "rent" | "daily_rent" | "exchange" | "mortgage";
  category?: string;
  categories?: string[];
  city?: string;
  district?: string;
  status?: "pending" | "active" | "sold" | "expired" | "rejected";
  isUrgent?: boolean;
  hasImage?: boolean;
  hasVideo?: boolean;
  userId?: string;
  isVip?: boolean;
  sortBy?:
    | "price_asc"
    | "price_desc"
    | "newest"
    | "oldest"
    | "most_viewed"
    | "most_saved";
  page?: number;
  limit?: number;
}

export class AdFilterService {
  static buildFilterQuery(options: AdFilterOptions): any {
    const filter: any = {};

    filter.status = options.status || "active";

    if (options.search && options.search.trim()) {
      filter.$text = { $search: options.search };
    }

    if (options.minPrice !== undefined || options.maxPrice !== undefined) {
      filter.price = {};
      if (options.minPrice !== undefined) {
        filter.price.$gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        filter.price.$lte = options.maxPrice;
      }
    }

    if (options.priceType) {
      filter.priceType = options.priceType;
    }

    if (options.adType) {
      filter.adType = options.adType;
    }

    if (options.categories && options.categories.length > 0) {
      filter.category = { $in: options.categories };
    } else if (options.category) {
      filter.category = options.category;
    }

    if (options.city) {
      filter.city = { $regex: new RegExp(options.city, "i") };
    }

    if (options.district) {
      filter.district = { $regex: new RegExp(options.district, "i") };
    }

    if (options.isUrgent !== undefined) {
      filter.isUrgent = options.isUrgent;
    }

    if (options.hasImage) {
      filter.images = { $exists: true, $not: { $size: 0 } };
    }

    if (options.hasVideo) {
      filter.video = { $exists: true, $ne: null };
    }

    if (options.userId) {
      filter.userId = options.userId;
    }

    if (options.isVip !== undefined) {
      filter.isVip = options.isVip;
    }

    return filter;
  }

  static buildSort(options: AdFilterOptions): any {
    switch (options.sortBy) {
      case "price_asc":
        return { price: 1, createdAt: -1 };
      case "price_desc":
        return { price: -1, createdAt: -1 };
      case "newest":
        return { createdAt: -1 };
      case "oldest":
        return { createdAt: 1 };
      case "most_viewed":
        return { views: -1, createdAt: -1 };
      case "most_saved":
        return { saves: -1, createdAt: -1 };
      default:
        return { isUrgent: -1, createdAt: -1 };
    }
  }

  static buildPagination(options: AdFilterOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  static async applyFilters(
    model: any,
    options: AdFilterOptions,
    additionalPopulate?: string[],
  ) {
    const filter = this.buildFilterQuery(options);
    const sort = this.buildSort(options);
    const { page, limit, skip } = this.buildPagination(options);

    let query = model.find(filter).sort(sort).skip(skip).limit(limit);

    if (additionalPopulate && additionalPopulate.length > 0) {
      additionalPopulate.forEach((field) => {
        query = query.populate(field);
      });
    }

    const [ads, total] = await Promise.all([
      query.exec(),
      model.countDocuments(filter),
    ]);

    return {
      ads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filter: {
        applied: Object.keys(filter).filter((k) => filter[k] !== undefined),
      },
    };
  }
}
