# NI-DAQ importer

Tool to import tdms files from National instruments to your manager. 

Check out our python tdms and ni-daq interface or directly buy 
insights from us! RWTH Aachen, WZL, IPT! 

Features (python NI-Interface):
 - Plug&Play
 - no LabView needed
 - realtime insights on your manager
 - Toolkit for insights (FFT, TimeSeries analysis, ML+AI)


This importer publishes 
```
{
    'pos': pos,
    'FFT': FFT,
    'max_amp_rechts': max_amp_rechts,
    'max_amp_links': max_amp_links,
    'stdDev_rechts': stdDev_rechts,
    'stdDev_links': stdDev_links,
    'skew_rechts': skew_rechts,
    'skew_links': skew_links,
    'kurtosis_rechts': kurtosis_rechts,
    'kurtosis_links': kurtosis_links,
    'AE_rechts': AE_rechts,
    'AE_rinks': AE_rinks
}
```