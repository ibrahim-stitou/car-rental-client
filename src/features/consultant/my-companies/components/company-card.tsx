'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, CreditCard, Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLanguage } from '@/context/LanguageContext';

type CompanyCardProps = {
  company: {
    id: number;
    name: string;
    companyid: string;
    pays: {
      id: number;
      nom: string;
    };
    IBAN?: string;
    bank_name?: string;
  };
  onDelete?: (id: number) => void;
};

const CompanyCard = ({ company, onDelete }: CompanyCardProps) => {
  const { t } = useLanguage();

  return (
    <Card className="h-full overflow-hidden border shadow-sm transition-all hover:shadow-md py-0">
      <CardContent className="p-0">
        <div className="relative bg-gray-50 p-4">
          {onDelete && (
            <div className="absolute right-2 top-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(company.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('consultant.my_companies.delete_company')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('consultant.my_companies.delete_company')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-gray-700" />
            <h3 className="flex-1 font-medium">{company.name}</h3>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span className="font-medium text-gray-700">
              {t('consultant.my_companies.company_id')}:
            </span>
            <span className="ml-1">{company.companyid}</span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start space-x-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
            <span>{company.pays.nom}</span>
          </div>

          {(company.IBAN || company.bank_name) && (
            <div className="mt-3 flex items-start space-x-2 text-sm">
              <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-500" />
              <div>
                {company.bank_name && <div>{company.bank_name}</div>}
                {company.IBAN && (
                  <div className="font-mono text-xs text-gray-500">{company.IBAN}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/consultant/companies/${company.id}/edit`}>
            {t('consultant.my_companies.edit_company')}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CompanyCard;